import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPostById, getComments, createComment, updateComment, deleteComment, deletePost, getSubmissions, submitAssignment, submitQuiz, submitQuestion, gradeSubmission } from "@/services/content-service";
import { getClassroomById, getMembers } from "@/services/classroom-service";
import { getUsers } from "@/services/user-service";
import { MentionInput, MentionText } from "@/shared/components/Mention";
import { getFileUrl } from "@/services/file-service";
import { uploadMultipleFiles } from "@/services/file-service";
import { useAuth } from "@/context/AuthContext";
import NavLinksClass from "../components/NavLinksClass";
import EditPostDialog from "../components/EditPostDialog";
import FileAttachments from "../components/FileAttachments";
import type { AttachmentMeta } from "../components/FileAttachments";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  BookOpen,
  ClipboardList,
  FileText,
  HelpCircle,
  Megaphone,
  ArrowLeft,
  Send,
  Trash2,
  Download,
  Calendar,
  Award,
  MoreVertical,
  Pencil,
  Check,
  X,
  Users,
} from "lucide-react";
import type { Classroom, Post, Comment, Submission, UserSummary, QuizFeedback, QuestionData, QuizData } from "@/shared/types";
import { formatDateTime } from "@/shared/lib/utils";

const postTypeIcon = (type: string) => {
  switch (type) {
    case "STUDY_MATERIAL": return <BookOpen className="w-5 h-5 text-[#137FEC]" />;
    case "ASSIGNMENT": return <ClipboardList className="w-5 h-5 text-green-600" />;
    case "QUIZ": return <FileText className="w-5 h-5 text-purple-600" />;
    case "QUESTION": return <HelpCircle className="w-5 h-5 text-amber-600" />;
    case "ANNOUNCEMENT": return <Megaphone className="w-5 h-5 text-red-500" />;
    default: return <FileText className="w-5 h-5 text-gray-500" />;
  }
};

const PostDetail = () => {
  const { classId, postId } = useParams<{ classId: string; postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [commentText, setCommentText] = useState("");
  const [commentMentions, setCommentMentions] = useState<string[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<AttachmentMeta[]>([]);
  const [subUploading, setSubUploading] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { points: string; feedback: string }>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [questionAnswer, setQuestionAnswer] = useState("");

  const { data: classroom } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  const { data: post, isLoading, error } = useQuery<Post & { comments?: Comment[] }>({
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId!),
    enabled: !!postId,
  });

  const { data: comments } = useQuery<Comment[]>({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId!),
    enabled: !!postId,
  });

  const isAdmin = classroom?.userRole === "ADMIN";
  const isMember = classroom?.userRole === "MEMBER";
  const isTeaching = classroom?.type === "TEACHING";
  const isAssignment = post?.type === "ASSIGNMENT";
  const isQuiz = post?.type === "QUIZ";
  const isQuestion = post?.type === "QUESTION";
  const questionData = isQuestion && post?.quizData ? (post.quizData as QuestionData) : null;
  const quizData = isQuiz && post?.quizData ? (post.quizData as QuizData) : null;
  const isQuestionMC = questionData?.answerType === "multiple_choice";
  const isQuestionText = questionData?.answerType === "text";

  const { data: submissions } = useQuery<Submission | Submission[]>({
    queryKey: ["submissions", postId],
    queryFn: () => getSubmissions(postId!),
    enabled: !!postId && (isAssignment || isQuiz || isQuestion) && isTeaching,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", classId],
    queryFn: () => getMembers(classId!),
    enabled: !!classId,
  });
  const memberList = membersData?.members ?? [];

  const allComments = comments ?? post?.comments ?? [];
  const commentAuthorIds = [...new Set(allComments.map((c) => c.authorId))];
  const submissionStudentIds = Array.isArray(submissions)
    ? [...new Set(submissions.map((s) => s.studentId))]
    : [];
  const allUserIds = [
    ...new Set([
      ...commentAuthorIds,
      ...submissionStudentIds,
      ...memberList.map((m) => m.userId),
    ]),
  ];

  const { data: userMap } = useQuery<Map<string, UserSummary>>({
    queryKey: ["users", allUserIds.sort().join(",")],
    queryFn: async () => {
      if (allUserIds.length === 0) return new Map();
      const users = await getUsers(allUserIds);
      return new Map(users.map((u) => [u.userId, u]));
    },
    enabled: allUserIds.length > 0,
  });

  const handleSubAddFiles = useCallback(async (files: FileList) => {
    setSubUploading(true);
    try {
      const uploaded = await uploadMultipleFiles(Array.from(files));
      const metas: AttachmentMeta[] = uploaded.map((f: any) => ({
        fileKey: f.fileKey,
        fileName: f.fileName,
        fileSize: f.fileSize,
        fileType: f.fileType,
      }));
      setSubmissionFiles((prev) => [...prev, ...metas]);
    } catch {
      // upload failed
    } finally {
      setSubUploading(false);
    }
  }, []);

  const handleSubRemoveFile = useCallback((index: number) => {
    setSubmissionFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDownload = async (fileKey: string, fileName: string) => {
    const url = await getFileUrl(fileKey);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const addComment = useMutation({
    mutationFn: () => createComment(postId!, commentText.trim(), commentMentions),
    onSuccess: () => {
      setCommentText("");
      setCommentMentions([]);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const editComment = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(commentId, content),
    onSuccess: () => {
      setEditingCommentId(null);
      setEditingCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const removeComment = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const submit = useMutation({
    mutationFn: () => submitAssignment({
      postId: postId!,
      content: submissionText.trim() || undefined,
      attachments: submissionFiles.length > 0 ? submissionFiles : undefined,
    }),
    onSuccess: () => {
      setSubmissionText("");
      setSubmissionFiles([]);
      queryClient.invalidateQueries({ queryKey: ["submissions", postId] });
    },
  });

  const grade = useMutation({
    mutationFn: ({ submissionId, points, feedback }: { submissionId: string; points: number; feedback?: string }) =>
      gradeSubmission(submissionId, { points, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", postId] });
    },
  });

  const removePost = useMutation({
    mutationFn: () => deletePost(postId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", classId] });
      navigate(`/c/${classId}/stream`);
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: () => submitQuiz(postId!, quizAnswers),
    onSuccess: () => {
      setQuizAnswers({});
      queryClient.invalidateQueries({ queryKey: ["submissions", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const submitQuestionMC = useMutation({
    mutationFn: () => submitQuiz(postId!, quizAnswers),
    onSuccess: () => {
      setQuizAnswers({});
      queryClient.invalidateQueries({ queryKey: ["submissions", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const submitQuestionText = useMutation({
    mutationFn: () => submitQuestion(postId!, questionAnswer.trim()),
    onSuccess: () => {
      setQuestionAnswer("");
      queryClient.invalidateQueries({ queryKey: ["submissions", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-gray-400">Loading post...</div>;
  if (error || !post) return <div className="p-6 text-sm text-red-500">Post not found</div>;

  const userName = (userId: string) => {
    const u = userMap?.get(userId);
    if (u) return `${u.userName ?? ""} ${u.userLastName ?? ""}`.trim() || "Unknown";
    if (userId === user?.userId) {
      const p = user.profile;
      return p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "You" : "You";
    }
    return "Unknown";
  };

  const userInitials = (userId: string) => {
    const u = userMap?.get(userId);
    if (u) return `${u.userName?.[0] ?? ""}${u.userLastName?.[0] ?? ""}`.toUpperCase() || "?";
    if (userId === user?.userId && user.profile) {
      return `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase() || "?";
    }
    return "?";
  };

  const mentionMembers = memberList
    .filter((m) => m.userId !== user?.userId)
    .map((m) => ({ userId: m.userId, name: userName(m.userId) }))
    .filter((m) => m.name && m.name !== "Unknown");
  const memberNames = memberList
    .map((m) => userName(m.userId))
    .filter((n) => n && n !== "Unknown");

  const mySubmission = !Array.isArray(submissions) ? submissions : undefined;
  const allSubmissions = Array.isArray(submissions) ? submissions : [];

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col pl-6 pb-4">
        <NavLinksClass
          classId={classId!}
          activeTab="Stream"
          classroomType={classroom?.type ?? "TEACHING"}
          userRole={classroom?.userRole ?? "MEMBER"}
          chatEnabled={classroom?.chatEnabled ?? true}
        />
        <div className="flex-1 overflow-y-auto py-4 pr-6 px-6">
          {/* Back button */}
          <button
            onClick={() => navigate(`/c/${classId}/stream`)}
            className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#137FEC] mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to stream
          </button>

          <div className="flex gap-6">
            {/* Left column — post content + comments */}
            <div className="flex-1 min-w-0">
              {/* Post header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
                  {postTypeIcon(post.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-[#0F172A]">{post.title}</h1>
                  <p className="text-sm text-[#64748B] mt-1">
                    {post.type.replace("_", " ")}
                    {post.studyMaterialType ? ` · ${post.studyMaterialType}` : ""}
                    {" · "}
                    {formatDateTime(post.createdAt)}
                  </p>
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-full hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                        <MoreVertical className="w-5 h-5 text-[#64748B]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="cursor-pointer text-red-600 focus:text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Assignment info */}
              {isAssignment && isTeaching && (
                <div className="flex gap-4 mb-6">
                  {post.dueDate && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                      <Calendar className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[#64748B]">Due:</span>
                      <span className="font-medium">{formatDateTime(post.dueDate)}</span>
                    </div>
                  )}
                  {post.maxPoints !== null && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                      <Award className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[#64748B]">Points:</span>
                      <span className="font-medium">{post.maxPoints}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz info */}
              {isQuiz && isTeaching && (
                <div className="flex flex-wrap gap-4 mb-6">
                  {post.dueDate && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                      <Calendar className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[#64748B]">Due:</span>
                      <span className="font-medium">{formatDateTime(post.dueDate)}</span>
                    </div>
                  )}
                  {post.maxPoints !== null && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                      <Award className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[#64748B]">Total Points:</span>
                      <span className="font-medium">{post.maxPoints}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                    <FileText className="w-4 h-4 text-[#64748B]" />
                    <span className="text-[#64748B]">Questions:</span>
                    <span className="font-medium">{quizData?.questions?.length ?? 0}</span>
                  </div>
                </div>
              )}

              {/* Question info */}
              {isQuestion && isTeaching && questionData && (
                <div className="flex flex-wrap gap-4 mb-6">
                  {post.dueDate && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                      <Calendar className="w-4 h-4 text-[#64748B]" />
                      <span className="text-[#64748B]">Due:</span>
                      <span className="font-medium">{formatDateTime(post.dueDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                    <Award className="w-4 h-4 text-[#64748B]" />
                    <span className="text-[#64748B]">Points:</span>
                    <span className="font-medium">{questionData.question.points}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                    <HelpCircle className="w-4 h-4 text-[#64748B]" />
                    <span className="text-[#64748B]">Type:</span>
                    <span className="font-medium">{isQuestionMC ? "Multiple Choice" : "Text Answer"}</span>
                  </div>
                </div>
              )}

              {/* Assigned to indicator */}
              {(isAssignment || isQuiz || isQuestion) && isTeaching && isAdmin && post.assignedTo && post.assignedTo.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm mb-6">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 font-medium">
                    Assigned to {post.assignedTo.length} student{post.assignedTo.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Post content */}
              {post.content && (
                <div className="prose prose-sm max-w-none mb-6 text-[#334155] whitespace-pre-wrap">
                  {post.content}
                </div>
              )}

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {post.attachments.map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => handleDownload(att.fileKey, att.fileName)}
                        className="flex w-full items-center gap-3 rounded-lg border border-[#E2E8F0] p-3 text-sm hover:bg-[#F8FAFC] hover:border-[#137FEC]/40 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-[#137FEC]" />
                        <span className="flex-1 truncate text-[#334155] text-left">{att.fileName}</span>
                        <span className="text-xs text-[#94A3B8]">
                          {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz-taking form for MEMBERs (inline — takes full width since it's the main interaction) */}
              {isQuiz && isTeaching && isMember && !mySubmission && quizData && (
                <div className="mb-6 rounded-lg border border-[#E2E8F0] p-5">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Take Quiz</h3>
                  <div className="space-y-6">
                    {quizData.questions.map((q, idx) => (
                      <div key={q.id} className="space-y-2">
                        <p className="text-sm font-medium text-[#0F172A]">
                          {idx + 1}. {q.text}{" "}
                          <span className="text-xs text-[#64748B] font-normal">({q.points} pts)</span>
                        </p>
                        <div className="space-y-1.5 ml-5">
                          {q.options.map((opt, optIdx) => (
                            <label key={optIdx} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                              <input
                                type="radio"
                                name={`quiz-q-${q.id}`}
                                checked={quizAnswers[q.id] === optIdx}
                                onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                className="accent-blue-500"
                              />
                              <span className="text-sm text-[#334155]">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => submitQuizMutation.mutate()}
                    disabled={submitQuizMutation.isPending || Object.keys(quizAnswers).length < quizData.questions.length}
                    className="mt-5 bg-blue-500 hover:bg-blue-600 text-white"
                    size="sm"
                  >
                    {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                  </Button>
                  {submitQuizMutation.isError && (
                    <p className="text-xs text-red-500 mt-2">
                      {(submitQuizMutation.error as any)?.response?.data?.error || "Failed to submit quiz"}
                    </p>
                  )}
                </div>
              )}

              {/* Question MC form for MEMBERs */}
              {isQuestion && isQuestionMC && isTeaching && isMember && !mySubmission && questionData && (
                <div className="mb-6 rounded-lg border border-[#E2E8F0] p-5">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Answer Question</h3>
                  <p className="text-sm font-medium text-[#0F172A] mb-3">
                    {questionData.question.text}{" "}
                    <span className="text-xs text-[#64748B] font-normal">({questionData.question.points} pts)</span>
                  </p>
                  <div className="space-y-1.5 ml-5">
                    {questionData.question.options?.map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                        <input
                          type="radio"
                          name={`question-${questionData.question.id}`}
                          checked={quizAnswers[questionData.question.id] === optIdx}
                          onChange={() => setQuizAnswers((prev) => ({ ...prev, [questionData.question.id]: optIdx }))}
                          className="accent-blue-500"
                        />
                        <span className="text-sm text-[#334155]">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={() => submitQuestionMC.mutate()}
                    disabled={submitQuestionMC.isPending || quizAnswers[questionData.question.id] === undefined}
                    className="mt-5 bg-blue-500 hover:bg-blue-600 text-white"
                    size="sm"
                  >
                    {submitQuestionMC.isPending ? "Submitting..." : "Submit Answer"}
                  </Button>
                  {submitQuestionMC.isError && (
                    <p className="text-xs text-red-500 mt-2">
                      {(submitQuestionMC.error as any)?.response?.data?.error || "Failed to submit answer"}
                    </p>
                  )}
                </div>
              )}

              {/* Submissions list for ADMINs */}
              {(isAssignment || isQuiz || isQuestion) && isTeaching && isAdmin && allSubmissions.length > 0 && (
                <div className="mb-6 rounded-lg border border-[#E2E8F0] p-5">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                    Submissions ({allSubmissions.length})
                  </h3>
                  <div className="space-y-4">
                    {allSubmissions.map((sub) => {
                      const gi = gradeInputs[sub.id] ?? { points: sub.points?.toString() ?? "", feedback: sub.feedback ?? "" };
                      const isAutoGraded = isQuiz || (isQuestion && isQuestionMC);
                      let autoFb: QuizFeedback | null = null;
                      if (isAutoGraded && sub.feedback) {
                        try { autoFb = JSON.parse(sub.feedback) as QuizFeedback; } catch { /* ignore */ }
                      }
                      return (
                        <div key={sub.id} className="rounded-lg border border-[#E2E8F0] p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                                {userInitials(sub.studentId)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{userName(sub.studentId)}</span>
                            <span className="text-xs text-[#94A3B8] ml-auto">
                              {formatDateTime(sub.createdAt)}
                            </span>
                          </div>

                          {isAutoGraded ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-[#0F172A]">
                                Score: {sub.points}{post.maxPoints !== null ? `/${post.maxPoints}` : ""} points
                              </p>
                              {isQuiz && autoFb?.results && post.quizData && "questions" in post.quizData && (
                                <div className="space-y-1.5">
                                  {post.quizData.questions.map((q, idx) => {
                                    const r = autoFb!.results.find((r) => r.questionId === q.id);
                                    return (
                                      <div key={q.id} className="flex items-center justify-between text-xs">
                                        <span className="text-[#334155]">{idx + 1}. {q.text}</span>
                                        <span className={r?.correct ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                          {r?.earnedPoints}/{q.points}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {isQuestion && isQuestionMC && autoFb?.results?.[0] && questionData && (
                                <p className={`text-sm font-medium ${autoFb.results[0].correct ? "text-green-600" : "text-red-600"}`}>
                                  {autoFb.results[0].correct ? "Correct" : "Incorrect"}
                                </p>
                              )}
                            </div>
                          ) : (
                            <>
                              {sub.content && (
                                <p className="text-sm text-[#334155] mb-3 whitespace-pre-wrap">{sub.content}</p>
                              )}
                              {sub.attachments && sub.attachments.length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                  {sub.attachments.map((att: any) => (
                                    <button
                                      key={att.id ?? att.fileKey}
                                      type="button"
                                      onClick={() => handleDownload(att.fileKey, att.fileName)}
                                      className="flex w-full items-center gap-2 rounded-lg border border-[#E2E8F0] p-2.5 text-sm hover:bg-[#F8FAFC] hover:border-[#137FEC]/40 transition-colors cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5 text-[#137FEC]" />
                                      <span className="flex-1 truncate text-[#334155] text-left">{att.fileName}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-end gap-3">
                                <div className="flex-1">
                                  <label className="text-xs text-[#64748B]">Points{post.maxPoints !== null ? ` (max ${post.maxPoints})` : ""}</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={post.maxPoints ?? undefined}
                                    value={gi.points}
                                    onChange={(e) =>
                                      setGradeInputs((prev) => ({
                                        ...prev,
                                        [sub.id]: { ...gi, points: e.target.value },
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="flex-[2]">
                                  <label className="text-xs text-[#64748B]">Feedback</label>
                                  <input
                                    type="text"
                                    value={gi.feedback}
                                    onChange={(e) =>
                                      setGradeInputs((prev) => ({
                                        ...prev,
                                        [sub.id]: { ...gi, feedback: e.target.value },
                                      }))
                                    }
                                    placeholder="Optional feedback"
                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={!gi.points || grade.isPending}
                                  onClick={() =>
                                    grade.mutate({
                                      submissionId: sub.id,
                                      points: Number(gi.points),
                                      feedback: gi.feedback || undefined,
                                    })
                                  }
                                >
                                  {sub.gradedAt ? "Re-grade" : "Grade"}
                                </Button>
                              </div>
                              {sub.gradedAt && (
                                <p className="text-xs text-green-600 mt-2">
                                  Graded: {sub.points}{post.maxPoints !== null ? `/${post.maxPoints}` : ""} points
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="border-t border-[#E2E8F0] pt-5">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-4">
                  Comments ({allComments.length})
                </h3>
                <div className="space-y-4 mb-4">
                  {allComments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                          {userInitials(c.authorId)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#0F172A]">{userName(c.authorId)}</span>
                          <span className="text-xs text-[#94A3B8]">
                            {formatDateTime(c.createdAt)}
                          </span>
                          <div className="ml-auto flex items-center gap-1">
                            {c.authorId === user?.userId && editingCommentId !== c.id && (
                              <button
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditingCommentText(c.content);
                                }}
                                className="text-[#94A3B8] hover:text-blue-500 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(c.authorId === user?.userId || isAdmin) && editingCommentId !== c.id && (
                              <button
                                onClick={() => removeComment.mutate(c.id)}
                                className="text-[#94A3B8] hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {editingCommentId === c.id ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && editingCommentText.trim()) {
                                  editComment.mutate({ commentId: c.id, content: editingCommentText.trim() });
                                }
                                if (e.key === "Escape") {
                                  setEditingCommentId(null);
                                  setEditingCommentText("");
                                }
                              }}
                              autoFocus
                              className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => editComment.mutate({ commentId: c.id, content: editingCommentText.trim() })}
                              disabled={!editingCommentText.trim() || editComment.isPending}
                              className="text-green-600 hover:text-green-700 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingCommentId(null); setEditingCommentText(""); }}
                              className="text-[#94A3B8] hover:text-gray-600 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-[#334155] mt-0.5 break-words">
                            <MentionText text={c.content} names={memberNames} />
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {allComments.length === 0 && (
                    <p className="text-sm text-[#94A3B8]">No comments yet</p>
                  )}
                </div>

                {/* Add comment */}
                <div className="flex gap-3 items-start">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                      {user?.profile
                        ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase()
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <MentionInput
                      value={commentText}
                      onChange={setCommentText}
                      members={mentionMembers}
                      onMentionsChange={setCommentMentions}
                      placeholder="Add a comment..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && commentText.trim()) addComment.mutate();
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <Button
                      size="sm"
                      onClick={() => addComment.mutate()}
                      disabled={!commentText.trim() || addComment.isPending}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — submission panel (member view) */}
            {(isAssignment || isQuiz || isQuestion) && isTeaching && isMember && (
              <div className="w-72 shrink-0">
                <div className="sticky top-0 space-y-4">
                  {/* Assignment submission */}
                  {isAssignment && (
                    <div className="rounded-lg border border-[#E2E8F0] p-5">
                      <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Your Submission</h3>
                      {mySubmission ? (
                        <div className="space-y-2">
                          {mySubmission.content && (
                            <p className="text-sm text-[#334155] whitespace-pre-wrap">{mySubmission.content}</p>
                          )}
                          {mySubmission.attachments && mySubmission.attachments.length > 0 && (
                            <div className="space-y-1.5 mt-2">
                              {mySubmission.attachments.map((att: any) => (
                                <button
                                  key={att.id ?? att.fileKey}
                                  type="button"
                                  onClick={() => handleDownload(att.fileKey, att.fileName)}
                                  className="flex w-full items-center gap-2 rounded-lg border border-[#E2E8F0] p-2.5 text-sm hover:bg-[#F8FAFC] hover:border-[#137FEC]/40 transition-colors cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#137FEC]" />
                                  <span className="flex-1 truncate text-[#334155] text-left">{att.fileName}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-[#64748B]">
                            Submitted {formatDateTime(mySubmission.createdAt)}
                          </p>
                          {mySubmission.gradedAt && (
                            <div className="mt-2 rounded-lg bg-green-50 border border-green-200 p-3">
                              <p className="text-sm font-medium text-green-800">
                                Grade: {mySubmission.points}{post.maxPoints !== null ? `/${post.maxPoints}` : " points"}
                              </p>
                              {mySubmission.feedback && (
                                <p className="text-sm text-green-700 mt-1">{mySubmission.feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            placeholder="Write your submission..."
                            rows={4}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                          />
                          <FileAttachments
                            attachments={submissionFiles}
                            onAdd={handleSubAddFiles}
                            onRemove={handleSubRemoveFile}
                            uploading={subUploading}
                          />
                          <Button
                            onClick={() => submit.mutate()}
                            disabled={submit.isPending || subUploading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                            size="sm"
                          >
                            {submit.isPending ? "Submitting..." : "Submit"}
                          </Button>
                          {submit.isError && (
                            <p className="text-xs text-red-500">
                              {(submit.error as any)?.response?.data?.error || "Failed to submit"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quiz results */}
                  {isQuiz && mySubmission && (
                    <div className="rounded-lg border border-[#E2E8F0] p-5">
                      <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Quiz Results</h3>
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4">
                        <p className="text-sm font-medium text-green-800">
                          Score: {mySubmission.points}{post.maxPoints !== null ? `/${post.maxPoints}` : ""} points
                        </p>
                      </div>
                      {mySubmission.feedback && post.quizData && "questions" in post.quizData && (() => {
                        let fb: QuizFeedback | null = null;
                        try { fb = JSON.parse(mySubmission.feedback) as QuizFeedback; } catch { /* ignore */ }
                        if (!fb?.results) return null;
                        return (
                          <div className="space-y-2">
                            {post.quizData.questions.map((q, idx) => {
                              const result = fb!.results.find((r) => r.questionId === q.id);
                              return (
                                <div
                                  key={q.id}
                                  className={`rounded-lg p-3 border ${result?.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-[#0F172A]">
                                      {idx + 1}. {q.text}
                                    </p>
                                    <span className={`text-xs font-semibold ${result?.correct ? "text-green-600" : "text-red-600"}`}>
                                      {result?.earnedPoints}/{q.points}
                                    </span>
                                  </div>
                                  {q.correctIndex !== undefined && (
                                    <p className="text-xs text-[#64748B] mt-1">
                                      Correct answer: {q.options[q.correctIndex]}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Question text answer form */}
                  {isQuestion && isQuestionText && (
                    <div className="rounded-lg border border-[#E2E8F0] p-5">
                      <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Your Answer</h3>
                      {mySubmission ? (
                        <div className="space-y-2">
                          {mySubmission.content && (
                            <p className="text-sm text-[#334155] whitespace-pre-wrap">{mySubmission.content}</p>
                          )}
                          <p className="text-xs text-[#64748B]">
                            Submitted {formatDateTime(mySubmission.createdAt)}
                          </p>
                          {mySubmission.gradedAt && (
                            <div className="mt-2 rounded-lg bg-green-50 border border-green-200 p-3">
                              <p className="text-sm font-medium text-green-800">
                                Grade: {mySubmission.points}{post.maxPoints !== null ? `/${post.maxPoints}` : " points"}
                              </p>
                              {mySubmission.feedback && (
                                <p className="text-sm text-green-700 mt-1">{mySubmission.feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {questionData && (
                            <p className="text-sm text-[#334155] font-medium">{questionData.question.text}</p>
                          )}
                          <textarea
                            value={questionAnswer}
                            onChange={(e) => setQuestionAnswer(e.target.value)}
                            placeholder="Write your answer..."
                            rows={4}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                          />
                          <Button
                            onClick={() => submitQuestionText.mutate()}
                            disabled={submitQuestionText.isPending || !questionAnswer.trim()}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                            size="sm"
                          >
                            {submitQuestionText.isPending ? "Submitting..." : "Submit Answer"}
                          </Button>
                          {submitQuestionText.isError && (
                            <p className="text-xs text-red-500">
                              {(submitQuestionText.error as any)?.response?.data?.error || "Failed to submit"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question MC results */}
                  {isQuestion && isQuestionMC && mySubmission && questionData && (
                    <div className="rounded-lg border border-[#E2E8F0] p-5">
                      <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Result</h3>
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-3">
                        <p className="text-sm font-medium text-green-800">
                          Score: {mySubmission.points}{post.maxPoints !== null ? `/${post.maxPoints}` : ""} points
                        </p>
                      </div>
                      {mySubmission.feedback && (() => {
                        let fb: QuizFeedback | null = null;
                        try { fb = JSON.parse(mySubmission.feedback) as QuizFeedback; } catch { /* ignore */ }
                        if (!fb?.results?.[0]) return null;
                        const result = fb.results[0];
                        return (
                          <div className={`rounded-lg p-3 border ${result.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                            <p className="text-sm font-medium text-[#0F172A]">{questionData.question.text}</p>
                            <p className={`text-xs font-semibold mt-1 ${result.correct ? "text-green-600" : "text-red-600"}`}>
                              {result.correct ? "Correct" : "Incorrect"}
                            </p>
                            {questionData.question.correctIndex !== undefined && questionData.question.options && (
                              <p className="text-xs text-[#64748B] mt-1">
                                Correct answer: {questionData.question.options[questionData.question.correctIndex]}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit post dialog */}
        {isAdmin && (
          <EditPostDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            post={post}
            classroomType={classroom?.type ?? "TEACHING"}
            chapters={classroom?.chapters ?? []}
          />
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-[400px]" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogDescription className="text-sm text-[#64748B] mt-2">
                Are you sure you want to delete "{post.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => removePost.mutate()}
                disabled={removePost.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {removePost.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
            {removePost.isError && (
              <p className="text-sm text-red-500 text-center">
                {(removePost.error as any)?.response?.data?.error || "Failed to delete post"}
              </p>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
};

export default PostDetail;

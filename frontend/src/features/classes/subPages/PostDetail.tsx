import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPostById, getComments, createComment, deleteComment, getSubmissions, submitAssignment, gradeSubmission } from "@/services/content-service";
import { getClassroomById } from "@/services/classroom-service";
import { getUsers } from "@/services/user-service";
import { getFileUrl } from "@/services/file-service";
import { uploadMultipleFiles } from "@/services/file-service";
import { useAuth } from "@/context/AuthContext";
import NavLinksClass from "../components/NavLinksClass";
import FileAttachments from "../components/FileAttachments";
import type { AttachmentMeta } from "../components/FileAttachments";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
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
} from "lucide-react";
import type { Classroom, Post, Comment, Submission, UserSummary } from "@/shared/types";

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
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<AttachmentMeta[]>([]);
  const [subUploading, setSubUploading] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { points: string; feedback: string }>>({});

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

  const { data: submissions } = useQuery<Submission | Submission[]>({
    queryKey: ["submissions", postId],
    queryFn: () => getSubmissions(postId!),
    enabled: !!postId && isAssignment && isTeaching,
  });

  const allComments = comments ?? post?.comments ?? [];
  const commentAuthorIds = [...new Set(allComments.map((c) => c.authorId))];
  const submissionStudentIds = Array.isArray(submissions)
    ? [...new Set(submissions.map((s) => s.studentId))]
    : [];
  const allUserIds = [...new Set([...commentAuthorIds, ...submissionStudentIds])];

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
    mutationFn: () => createComment(postId!, commentText.trim()),
    onSuccess: () => {
      setCommentText("");
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
        <div className="flex-1 overflow-y-auto py-4 pr-6 max-w-3xl mx-auto w-full">
          {/* Back button */}
          <button
            onClick={() => navigate(`/c/${classId}/stream`)}
            className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#137FEC] mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to stream
          </button>

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
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Assignment info */}
          {isAssignment && isTeaching && (
            <div className="flex gap-4 mb-6">
              {post.dueDate && (
                <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm">
                  <Calendar className="w-4 h-4 text-[#64748B]" />
                  <span className="text-[#64748B]">Due:</span>
                  <span className="font-medium">{new Date(post.dueDate).toLocaleString()}</span>
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

          {/* Submission section for MEMBERs */}
          {isAssignment && isTeaching && isMember && (
            <div className="mb-6 rounded-lg border border-[#E2E8F0] p-5">
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
                    Submitted {new Date(mySubmission.submittedAt).toLocaleString()}
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
                    className="bg-blue-500 hover:bg-blue-600 text-white"
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

          {/* Submissions list for ADMINs */}
          {isAssignment && isTeaching && isAdmin && allSubmissions.length > 0 && (
            <div className="mb-6 rounded-lg border border-[#E2E8F0] p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                Submissions ({allSubmissions.length})
              </h3>
              <div className="space-y-4">
                {allSubmissions.map((sub) => {
                  const gi = gradeInputs[sub.id] ?? { points: sub.points?.toString() ?? "", feedback: sub.feedback ?? "" };
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
                          {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>
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
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                      {(c.authorId === user?.userId || isAdmin) && (
                        <button
                          onClick={() => removeComment.mutate(c.id)}
                          className="ml-auto text-[#94A3B8] hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-[#334155] mt-0.5">{c.content}</p>
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
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commentText.trim()) addComment.mutate();
                  }}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
      </section>
    </div>
  );
};

export default PostDetail;

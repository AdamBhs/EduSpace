import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadMultipleFiles } from "@/services/file-service";
import FileAttachments from "./FileAttachments";
import type { AttachmentMeta } from "./FileAttachments";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { createPost } from "@/services/content-service";
import type { Chapter, ClassroomType, PostType, StudyMaterialType, QuizQuestion, QuestionData } from "@/shared/types";
import QuizBuilder from "./QuizBuilder";
import DateTimeInput from "@/shared/components/ui/date-time-input";
import {
  BookOpen,
  ClipboardList,
  FileText,
  HelpCircle,
  Megaphone,
  Settings2,
  Plus,
  X,
  CircleCheck,
} from "lucide-react";
import ChapterManager from "./ChapterManager";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classroomType: ClassroomType;
  chapters: Chapter[];
}

const POST_TYPES: { value: PostType; label: string; icon: React.ReactNode; teachingOnly?: boolean }[] = [
  { value: "ANNOUNCEMENT", label: "Announcement", icon: <Megaphone className="size-4" /> },
  { value: "STUDY_MATERIAL", label: "Study Material", icon: <BookOpen className="size-4" /> },
  { value: "QUIZ", label: "Quiz", icon: <FileText className="size-4" />, teachingOnly: true },
  { value: "QUESTION", label: "Question", icon: <HelpCircle className="size-4" />, teachingOnly: true },
  { value: "ASSIGNMENT", label: "Assignment", icon: <ClipboardList className="size-4" />, teachingOnly: true },
];

const STUDY_MATERIAL_TYPES: { value: StudyMaterialType; label: string }[] = [
  { value: "COURS", label: "Cours" },
  { value: "TD", label: "TD" },
  { value: "TP", label: "TP" },
  { value: "RESUME", label: "Résumé" },
];

const CreatePostDialog = ({
  open,
  onOpenChange,
  classId,
  classroomType,
  chapters,
}: CreatePostDialogProps) => {
  const queryClient = useQueryClient();
  const isTeaching = classroomType === "TEACHING";

  const [postType, setPostType] = useState<PostType>("ANNOUNCEMENT");
  const [studyMaterialType, setStudyMaterialType] = useState<StudyMaterialType>("COURS");
  const [chapterId, setChapterId] = useState<string>(
    chapters.find((c) => c.name === "General")?.id ?? chapters[0]?.id ?? "",
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showChapterMgr, setShowChapterMgr] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [questionAnswerType, setQuestionAnswerType] = useState<"multiple_choice" | "text">("multiple_choice");
  const [questionText, setQuestionText] = useState("");
  const [questionOptions, setQuestionOptions] = useState<string[]>(["", ""]);
  const [questionCorrectIndex, setQuestionCorrectIndex] = useState(0);
  const [questionPoints, setQuestionPoints] = useState("1");

  useEffect(() => {
    if (!chapterId && chapters.length > 0) {
      setChapterId(chapters.find((c) => c.name === "General")?.id ?? chapters[0]?.id ?? "");
    }
  }, [chapters, chapterId]);

  const handleAddFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    try {
      const uploaded = await uploadMultipleFiles(Array.from(files));
      const metas: AttachmentMeta[] = uploaded.map((f: any) => ({
        fileKey: f.fileKey,
        fileName: f.fileName,
        fileSize: f.fileSize,
        fileType: f.fileType,
      }));
      setAttachments((prev) => [...prev, ...metas]);
    } catch {
      // upload failed — user can retry
    } finally {
      setUploading(false);
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const mutation = useMutation({
    mutationFn: () => {
      let questionData: QuestionData | undefined;
      if (postType === "QUESTION") {
        questionData = {
          answerType: questionAnswerType,
          question: {
            id: `q_${Date.now()}_1`,
            text: questionText.trim(),
            ...(questionAnswerType === "multiple_choice" && {
              options: questionOptions.map(o => o.trim()),
              correctIndex: questionCorrectIndex,
            }),
            points: Number(questionPoints) || 1,
          },
        };
      }
      return createPost({
        classId,
        chapterId,
        title: title.trim(),
        content: content.trim() || undefined,
        type: postType,
        studyMaterialType: postType === "STUDY_MATERIAL" ? studyMaterialType : undefined,
        quizData: postType === "QUIZ" ? { questions: quizQuestions } : undefined,
        questionData,
        dueDate: (postType === "ASSIGNMENT" || postType === "QUIZ" || postType === "QUESTION") && dueDate ? dueDate : undefined,
        maxPoints: postType === "ASSIGNMENT" && maxPoints ? Number(maxPoints) : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", classId] });
      handleClose();
    },
  });

  const handleClose = () => {
    setPostType("ANNOUNCEMENT");
    setStudyMaterialType("COURS");
    setChapterId(chapters.find((c) => c.name === "General")?.id ?? chapters[0]?.id ?? "");
    setTitle("");
    setContent("");
    setDueDate("");
    setMaxPoints("");
    setAttachments([]);
    setQuizQuestions([]);
    setQuestionAnswerType("multiple_choice");
    setQuestionText("");
    setQuestionOptions(["", ""]);
    setQuestionCorrectIndex(0);
    setQuestionPoints("1");
    setShowChapterMgr(false);
    onOpenChange(false);
  };

  const isQuestionValid = postType !== "QUESTION" || (
    questionText.trim().length > 0 &&
    Number(questionPoints) >= 1 &&
    (questionAnswerType !== "multiple_choice" || (
      questionOptions.length >= 2 &&
      questionOptions.every(o => o.trim()) &&
      questionCorrectIndex < questionOptions.length
    ))
  );

  const isValid =
    title.trim().length > 0 &&
    chapterId &&
    (postType !== "ASSIGNMENT" || (maxPoints !== "" && Number(maxPoints) >= 1)) &&
    (postType !== "QUIZ" || (quizQuestions.length > 0 && quizQuestions.every(q => q.text.trim() && q.options.every(o => o.trim())))) &&
    isQuestionValid;

  const availableTypes = isTeaching
    ? POST_TYPES
    : POST_TYPES.filter((t) => !t.teachingOnly);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Post</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new post in this classroom
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Post type selector */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Post Type</p>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPostType(t.value)}
                  className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    postType === t.value
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Study material sub-type */}
          {postType === "STUDY_MATERIAL" && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Material Type</p>
              <div className="flex gap-2">
                {STUDY_MATERIAL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setStudyMaterialType(t.value)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                      studyMaterialType === t.value
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chapter selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Chapter</p>
              <button
                type="button"
                onClick={() => setShowChapterMgr((p) => !p)}
                className="flex items-center gap-1 text-xs text-[#137FEC] hover:text-[#1171d4] cursor-pointer"
              >
                <Settings2 className="w-3 h-3" />
                {showChapterMgr ? "Done" : "Manage"}
              </button>
            </div>
            {showChapterMgr ? (
              <ChapterManager classId={classId} chapters={chapters} />
            ) : (
              <Select value={chapterId} onValueChange={setChapterId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Title */}
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=" "
              className="peer w-full border-b border-gray-300 bg-transparent px-0 pb-1.5 pt-5 text-sm outline-none transition-colors focus:border-blue-500"
            />
            <label className="pointer-events-none absolute left-0 top-0 text-sm text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs">
              Title (required)
            </label>
          </div>

          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something..."
              rows={4}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 resize-none"
            />
          </div>

          {/* Quiz builder */}
          {postType === "QUIZ" && (
            <QuizBuilder questions={quizQuestions} onChange={setQuizQuestions} />
          )}

          {/* Question builder */}
          {postType === "QUESTION" && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Answer Type</p>
                <div className="flex gap-2">
                  {([["multiple_choice", "Multiple Choice"], ["text", "Text Answer"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuestionAnswerType(val)}
                      className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                        questionAnswerType === val
                          ? "border-blue-500 text-blue-600 bg-blue-50"
                          : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Question text *"
                  className="w-full border-b border-gray-300 bg-transparent px-0 pb-1.5 pt-1 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {questionAnswerType === "multiple_choice" && (
                <div className="space-y-2">
                  {questionOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuestionCorrectIndex(idx)}
                        className="cursor-pointer shrink-0"
                      >
                        <CircleCheck
                          className={`w-4.5 h-4.5 ${
                            questionCorrectIndex === idx
                              ? "text-green-500"
                              : "text-gray-300 hover:text-gray-400"
                          }`}
                        />
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...questionOptions];
                          next[idx] = e.target.value;
                          setQuestionOptions(next);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className={`flex-1 rounded border px-2.5 py-1.5 text-sm outline-none transition-colors ${
                          questionCorrectIndex === idx
                            ? "border-green-300 bg-green-50"
                            : "border-gray-200 focus:border-blue-500"
                        }`}
                      />
                      {questionOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = questionOptions.filter((_, i) => i !== idx);
                            setQuestionOptions(next);
                            if (questionCorrectIndex === idx) setQuestionCorrectIndex(0);
                            else if (questionCorrectIndex > idx) setQuestionCorrectIndex(questionCorrectIndex - 1);
                          }}
                          className="p-0.5 text-[#94A3B8] hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {questionOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setQuestionOptions([...questionOptions, ""])}
                      className="flex items-center gap-1 text-xs text-[#137FEC] hover:text-[#1171d4] ml-6.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add option
                    </button>
                  )}
                </div>
              )}

              <div className="w-32">
                <label className="text-sm font-medium text-muted-foreground">Points *</label>
                <input
                  type="number"
                  min="1"
                  value={questionPoints}
                  onChange={(e) => setQuestionPoints(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* File attachments */}
          <FileAttachments
            attachments={attachments}
            onAdd={handleAddFiles}
            onRemove={handleRemoveFile}
            uploading={uploading}
          />

          {/* Assignment-specific fields */}
          {postType === "ASSIGNMENT" && isTeaching && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <DateTimeInput value={dueDate} onChange={setDueDate} className="mt-1" />
              </div>
              <div className="w-32">
                <label className="text-sm font-medium text-muted-foreground">Max Points *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  placeholder="100"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Quiz / Question due date */}
          {(postType === "QUIZ" || postType === "QUESTION") && isTeaching && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Due Date</label>
              <DateTimeInput value={dueDate} onChange={setDueDate} className="mt-1" />
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending || uploading}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {mutation.isPending ? "Posting..." : "Post"}
          </Button>
        </DialogFooter>

        {mutation.isError && (
          <p className="text-sm text-red-500 text-center">
            {(mutation.error as any)?.response?.data?.error || "Failed to create post"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { updatePost } from "@/services/content-service";
import type { Post, Chapter, ClassroomType, QuizQuestion, QuestionData } from "@/shared/types";
import QuizBuilder from "./QuizBuilder";
import DateTimeInput from "@/shared/components/ui/date-time-input";
import { Plus, X, CircleCheck } from "lucide-react";
import StudentPicker from "./StudentPicker";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  classroomType: ClassroomType;
  chapters: Chapter[];
}

const EditPostDialog = ({
  open,
  onOpenChange,
  post,
  classroomType,
  chapters,
}: EditPostDialogProps) => {
  const queryClient = useQueryClient();
  const isTeaching = classroomType === "TEACHING";
  const isAssignment = post.type === "ASSIGNMENT";
  const isQuiz = post.type === "QUIZ";
  const isQuestion = post.type === "QUESTION";

  const [chapterId, setChapterId] = useState(post.chapterId);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content ?? "");
  const [dueDate, setDueDate] = useState(
    post.dueDate ? new Date(post.dueDate).toISOString().slice(0, 16) : "",
  );
  const [maxPoints, setMaxPoints] = useState(
    post.maxPoints !== null ? String(post.maxPoints) : "",
  );
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(
    (post.quizData && "questions" in post.quizData ? post.quizData.questions as QuizQuestion[] : []),
  );

  const hasAssignableType = isAssignment || isQuiz || isQuestion;
  const [allStudents, setAllStudents] = useState(!post.assignedTo || post.assignedTo.length === 0);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>(post.assignedTo ?? []);

  const existingQD = post.quizData && "answerType" in (post.quizData as any) ? (post.quizData as QuestionData) : null;
  const [questionAnswerType, setQuestionAnswerType] = useState<"multiple_choice" | "text">(existingQD?.answerType ?? "multiple_choice");
  const [questionText, setQuestionText] = useState(existingQD?.question?.text ?? "");
  const [questionOptions, setQuestionOptions] = useState<string[]>(existingQD?.question?.options ?? ["", ""]);
  const [questionCorrectIndex, setQuestionCorrectIndex] = useState(existingQD?.question?.correctIndex ?? 0);
  const [questionPoints, setQuestionPoints] = useState(String(existingQD?.question?.points ?? 1));

  useEffect(() => {
    if (open) {
      setChapterId(post.chapterId);
      setTitle(post.title);
      setContent(post.content ?? "");
      setDueDate(
        post.dueDate ? new Date(post.dueDate).toISOString().slice(0, 16) : "",
      );
      setMaxPoints(post.maxPoints !== null ? String(post.maxPoints) : "");
      setQuizQuestions(post.quizData && "questions" in post.quizData ? post.quizData.questions as QuizQuestion[] : []);
      setAllStudents(!post.assignedTo || post.assignedTo.length === 0);
      setAssignedStudentIds(post.assignedTo ?? []);
      const qd = post.quizData && "answerType" in (post.quizData as any) ? (post.quizData as QuestionData) : null;
      setQuestionAnswerType(qd?.answerType ?? "multiple_choice");
      setQuestionText(qd?.question?.text ?? "");
      setQuestionOptions(qd?.question?.options ?? ["", ""]);
      setQuestionCorrectIndex(qd?.question?.correctIndex ?? 0);
      setQuestionPoints(String(qd?.question?.points ?? 1));
    }
  }, [open, post]);

  const mutation = useMutation({
    mutationFn: () => {
      let questionData: QuestionData | undefined;
      if (isQuestion) {
        questionData = {
          answerType: questionAnswerType,
          question: {
            id: existingQD?.question?.id ?? `q_${Date.now()}_1`,
            text: questionText.trim(),
            ...(questionAnswerType === "multiple_choice" && {
              options: questionOptions.map(o => o.trim()),
              correctIndex: questionCorrectIndex,
            }),
            points: Number(questionPoints) || 1,
          },
        };
      }
      return updatePost(post.id, {
        title: title.trim(),
        content: content.trim() || undefined,
        chapterId,
        quizData: isQuiz ? { questions: quizQuestions } : undefined,
        questionData,
        assignedTo: hasAssignableType
          ? (allStudents ? null : assignedStudentIds.length > 0 ? assignedStudentIds : null)
          : undefined,
        dueDate: (isAssignment || isQuiz || isQuestion) && dueDate ? dueDate : undefined,
        maxPoints: isAssignment && maxPoints ? Number(maxPoints) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts", post.classId] });
      onOpenChange(false);
    },
  });

  const isQuestionValid = !isQuestion || (
    questionText.trim().length > 0 &&
    Number(questionPoints) >= 1 &&
    (questionAnswerType !== "multiple_choice" || (
      questionOptions.length >= 2 &&
      questionOptions.every(o => o.trim()) &&
      questionCorrectIndex < questionOptions.length
    ))
  );

  const assignValid = !hasAssignableType || allStudents || assignedStudentIds.length > 0;

  const isValid =
    title.trim().length > 0 &&
    chapterId &&
    (!isAssignment || (maxPoints !== "" && Number(maxPoints) >= 1)) &&
    (!isQuiz || (quizQuestions.length > 0 && quizQuestions.every(q => q.text.trim() && q.options.every(o => o.trim())))) &&
    isQuestionValid &&
    assignValid;

  const typeLabel = post.type.replace("_", " ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Post</DialogTitle>
          <DialogDescription className="sr-only">
            Edit this post
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Post type (read-only) */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Post Type</p>
            <p className="text-sm text-[#334155] capitalize">{typeLabel}{post.studyMaterialType ? ` · ${post.studyMaterialType}` : ""}</p>
          </div>

          {/* Chapter selector */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Chapter</p>
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
          {isQuiz && (
            <QuizBuilder questions={quizQuestions} onChange={setQuizQuestions} />
          )}

          {/* Question builder */}
          {isQuestion && (
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

          {/* Assign to */}
          {hasAssignableType && isTeaching && (
            <StudentPicker
              classId={post.classId}
              selectedIds={assignedStudentIds}
              onChange={setAssignedStudentIds}
              allStudents={allStudents}
              onToggleAll={setAllStudents}
            />
          )}

          {/* Assignment-specific fields */}
          {isAssignment && isTeaching && (
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
          {(isQuiz || isQuestion) && isTeaching && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Due Date</label>
              <DateTimeInput value={dueDate} onChange={setDueDate} className="mt-1" />
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>

        {mutation.isError && (
          <p className="text-sm text-red-500 text-center">
            {(mutation.error as any)?.response?.data?.error || "Failed to update post"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditPostDialog;

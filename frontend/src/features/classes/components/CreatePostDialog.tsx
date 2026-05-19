import { useState, useCallback } from "react";
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
import type { Chapter, ClassroomType, PostType, StudyMaterialType } from "@/shared/types";
import {
  BookOpen,
  ClipboardList,
  FileText,
  HelpCircle,
  Megaphone,
} from "lucide-react";

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
  { value: "QUIZ", label: "Quiz", icon: <FileText className="size-4" /> },
  { value: "QUESTION", label: "Question", icon: <HelpCircle className="size-4" /> },
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
    mutationFn: () =>
      createPost({
        classId,
        chapterId,
        title: title.trim(),
        content: content.trim() || undefined,
        type: postType,
        studyMaterialType: postType === "STUDY_MATERIAL" ? studyMaterialType : undefined,
        dueDate: postType === "ASSIGNMENT" && dueDate ? dueDate : undefined,
        maxPoints: postType === "ASSIGNMENT" && maxPoints ? Number(maxPoints) : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
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
    onOpenChange(false);
  };

  const isValid = title.trim().length > 0 && chapterId;

  const availableTypes = isTeaching
    ? POST_TYPES
    : POST_TYPES.filter((t) => !t.teachingOnly);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]" showCloseButton={false}>
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
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="w-32">
                <label className="text-sm font-medium text-muted-foreground">Max Points</label>
                <input
                  type="number"
                  min="0"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  placeholder="100"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
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

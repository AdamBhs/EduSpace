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
import type { Post, Chapter, ClassroomType } from "@/shared/types";

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

  const [chapterId, setChapterId] = useState(post.chapterId);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content ?? "");
  const [dueDate, setDueDate] = useState(
    post.dueDate ? new Date(post.dueDate).toISOString().slice(0, 16) : "",
  );
  const [maxPoints, setMaxPoints] = useState(
    post.maxPoints !== null ? String(post.maxPoints) : "",
  );

  useEffect(() => {
    if (open) {
      setChapterId(post.chapterId);
      setTitle(post.title);
      setContent(post.content ?? "");
      setDueDate(
        post.dueDate ? new Date(post.dueDate).toISOString().slice(0, 16) : "",
      );
      setMaxPoints(post.maxPoints !== null ? String(post.maxPoints) : "");
    }
  }, [open, post]);

  const mutation = useMutation({
    mutationFn: () =>
      updatePost(post.id, {
        title: title.trim(),
        content: content.trim() || undefined,
        chapterId,
        dueDate: isAssignment && dueDate ? dueDate : undefined,
        maxPoints: isAssignment && maxPoints ? Number(maxPoints) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts", post.classId] });
      onOpenChange(false);
    },
  });

  const isValid =
    title.trim().length > 0 &&
    chapterId &&
    (!isAssignment || (maxPoints !== "" && Number(maxPoints) >= 1));

  const typeLabel = post.type.replace("_", " ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]" showCloseButton={false}>
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

          {/* Assignment-specific fields */}
          {isAssignment && isTeaching && (
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

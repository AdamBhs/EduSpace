import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
} from "@/services/classroom-service";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import type { Chapter } from "@/shared/types";

interface ChapterManagerProps {
  classId: string;
  chapters: Chapter[];
}

const SortableChapterRow = ({
  ch,
  editingId,
  editName,
  setEditName,
  onStartEdit,
  onRename,
  onCancelEdit,
  onDelete,
  renamePending,
  deletePending,
}: {
  ch: Chapter;
  editingId: string | null;
  editName: string;
  setEditName: (v: string) => void;
  onStartEdit: (ch: Chapter) => void;
  onRename: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  renamePending: boolean;
  deletePending: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ch.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingId === ch.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 bg-white"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 text-[#C4CDD5] hover:text-[#94A3B8] cursor-grab active:cursor-grabbing touch-none"
        tabIndex={-1}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {isEditing ? (
        <>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRename();
              if (e.key === "Escape") onCancelEdit();
            }}
            className="h-7 text-sm flex-1"
            autoFocus
          />
          <button
            onClick={onRename}
            disabled={renamePending || !editName.trim()}
            className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCancelEdit}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-[#334155] truncate">{ch.name}</span>
          <button
            onClick={() => onStartEdit(ch)}
            className="p-1 text-[#94A3B8] hover:text-[#137FEC] hover:bg-blue-50 rounded cursor-pointer"
            title="Rename"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {ch.name !== "General" && (
            <button
              onClick={() => onDelete(ch.id)}
              disabled={deletePending}
              className="p-1 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-50 cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

const ChapterManager = ({ classId, chapters }: ChapterManagerProps) => {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["classroom", classId] });
    queryClient.invalidateQueries({ queryKey: ["chapters", classId] });
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => createChapter(classId, name),
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ chapterId, name }: { chapterId: string; name: string }) =>
      updateChapter(classId, chapterId, name),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (chapterId: string) => deleteChapter(classId, chapterId),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (chapterIds: string[]) => reorderChapters(classId, chapterIds),
    onSuccess: invalidate,
  });

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  };

  const startEdit = (ch: Chapter) => {
    setEditingId(ch.id);
    setEditName(ch.name);
  };

  const handleRename = () => {
    const trimmed = editName.trim();
    if (!trimmed || !editingId) return;
    renameMutation.mutate({ chapterId: editingId, name: trimmed });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...chapters];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const newIds = reordered.map((c) => c.id);

    queryClient.setQueryData<any>(["classroom", classId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        chapters: reordered.map((c, i) => ({ ...c, position: i })),
      };
    });

    reorderMutation.mutate(newIds);
  };

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {chapters.map((ch) => (
            <SortableChapterRow
              key={ch.id}
              ch={ch}
              editingId={editingId}
              editName={editName}
              setEditName={setEditName}
              onStartEdit={startEdit}
              onRename={handleRename}
              onCancelEdit={() => setEditingId(null)}
              onDelete={(id) => deleteMutation.mutate(id)}
              renamePending={renameMutation.isPending}
              deletePending={deleteMutation.isPending}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2 mt-3">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          placeholder="New chapter name..."
          className="h-8 text-sm flex-1"
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!newName.trim() || createMutation.isPending}
          className="h-8 bg-[#137FEC] hover:bg-[#1171d4] text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>

      {(createMutation.isError || renameMutation.isError || deleteMutation.isError || reorderMutation.isError) && (
        <p className="text-xs text-red-500 mt-1">
          {((createMutation.error || renameMutation.error || deleteMutation.error || reorderMutation.error) as any)?.response?.data?.error || "Operation failed"}
        </p>
      )}
    </div>
  );
};

export default ChapterManager;

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChapter, updateChapter, deleteChapter } from "@/services/classroom-service";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { Chapter } from "@/shared/types";

interface ChapterManagerProps {
  classId: string;
  chapters: Chapter[];
}

const ChapterManager = ({ classId, chapters }: ChapterManagerProps) => {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  return (
    <div className="space-y-2">
      {chapters.map((ch) => (
        <div
          key={ch.id}
          className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2"
        >
          {editingId === ch.id ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingId(null); }}
                className="h-7 text-sm flex-1"
                autoFocus
              />
              <button
                onClick={handleRename}
                disabled={renameMutation.isPending || !editName.trim()}
                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-[#334155] truncate">{ch.name}</span>
              <button
                onClick={() => startEdit(ch)}
                className="p-1 text-[#94A3B8] hover:text-[#137FEC] hover:bg-blue-50 rounded cursor-pointer"
                title="Rename"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {ch.name !== "General" && (
                <button
                  onClick={() => deleteMutation.mutate(ch.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-50 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2 mt-3">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
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

      {(createMutation.isError || renameMutation.isError || deleteMutation.isError) && (
        <p className="text-xs text-red-500 mt-1">
          {((createMutation.error || renameMutation.error || deleteMutation.error) as any)?.response?.data?.error || "Operation failed"}
        </p>
      )}
    </div>
  );
};

export default ChapterManager;

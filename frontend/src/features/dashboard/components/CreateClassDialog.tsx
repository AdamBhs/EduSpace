import { useState } from "react";
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
import { createClassroom } from "@/services/classroom-service";
import { GraduationCap, Smile } from "lucide-react";

type ClassroomType = "teaching" | "friendly";

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateClassDialog = ({ open, onOpenChange }: CreateClassDialogProps) => {
  const queryClient = useQueryClient();
  const [classroomType, setClassroomType] = useState<ClassroomType>("teaching");
  const [form, setForm] = useState({
    name: "",
    section: "",
    subject: "",
    description: "",
  });

  const createMutation = useMutation({
    mutationFn: () => createClassroom({ ...form, chapter: classroomType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      handleClose();
    },
    onError: (err: any) => {
      console.error("Failed to create classroom:", err);
    },
  });

  const handleClose = () => {
    setForm({ name: "", section: "", subject: "", description: "" });
    setClassroomType("teaching");
    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    form.name.trim() &&
    form.section.trim() &&
    form.subject.trim() &&
    form.description.trim();

  const handleCreate = () => {
    if (!isFormValid) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-110" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create class
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fill in the details to create a new classroom
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Type of Classroom
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setClassroomType("teaching")}
                className={`flex items-center gap-2 rounded-lg border-2 px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  classroomType === "teaching"
                    ? "border-blue-500 text-blue-500 bg-white"
                    : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                }`}
              >
                <GraduationCap className="size-4" />
                Teaching
              </button>
              <button
                type="button"
                onClick={() => setClassroomType("friendly")}
                className={`flex items-center gap-2 rounded-lg border-2 px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  classroomType === "friendly"
                    ? "border-blue-500 text-blue-500 bg-white"
                    : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                }`}
              >
                <Smile className="size-4" />
                Friendly
              </button>
            </div>
          </div>

          <FloatingInput
            label="Class name (required)"
            value={form.name}
            onChange={(v) => handleChange("name", v)}
          />
          <FloatingInput
            label="Section (required)"
            value={form.section}
            onChange={(v) => handleChange("section", v)}
          />
          <FloatingInput
            label="Subject (required)"
            value={form.subject}
            onChange={(v) => handleChange("subject", v)}
          />
          <FloatingInput
            label="Description (required)"
            value={form.description}
            onChange={(v) => handleChange("description", v)}
          />
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isFormValid || createMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function FloatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer w-full border-b border-gray-300 bg-transparent px-0 pb-1.5 pt-5 text-sm outline-none transition-colors focus:border-blue-500"
      />
      <label className="pointer-events-none absolute left-0 top-0 text-sm text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs">
        {label}
      </label>
    </div>
  );
}

export default CreateClassDialog;

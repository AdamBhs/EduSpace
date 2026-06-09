import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

const TermsDialog = ({ open, onOpenChange, onAccept }: TermsDialogProps) => {
  const [accepted, setAccepted] = useState(false);

  const handleClose = () => {
    setAccepted(false);
    onOpenChange(false);
  };

  const handleContinue = () => {
    setAccepted(false);
    onAccept();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[470px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Before you create a classroom
          </DialogTitle>
          <DialogDescription className="sr-only">
            Guidelines for creating a classroom on EduSpace
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            As the creator of a classroom, you are responsible for the content shared
            within it. You will have full admin privileges, including managing members,
            posts, chapters, and grades.
          </p>
          <p>
            Choose <span className="font-medium text-[#334155]">Teaching</span> if
            you need assignments, quizzes, grading, and a teacher-student structure.
            Choose <span className="font-medium text-[#334155]">Friendly</span> for
            casual collaboration without grading.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-lg bg-[#f5f7fa] p-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 size-4 rounded border-gray-300 accent-blue-500"
          />
          <span className="text-sm leading-snug">
            I understand that I am responsible for managing this classroom and its content
          </span>
        </label>

        <DialogFooter className="mt-1">
          <Button variant="ghost" onClick={handleClose}>
            Go back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!accepted}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;

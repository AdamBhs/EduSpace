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
            Using EduSpace at a school with students?
          </DialogTitle>
          <DialogDescription className="sr-only">
            Terms and conditions for creating a classroom
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">
          If so, your school must sign up for an{" "}
          <span className="text-blue-500 font-medium cursor-pointer hover:underline">
            EduSpace for Education
          </span>{" "}
          account before you can use Classroom.{" "}
          <span className="text-blue-500 font-medium cursor-pointer hover:underline">
            Learn More
          </span>
          . EduSpace for Education lets schools decide which EduSpace services their
          students can use, and provides additional privacy and security protections
          that are important in a school setting. Students cannot use EduSpace at a
          school with personal accounts.
        </p>

        <label className="flex items-start gap-3 rounded-lg bg-[#f5f7fa] p-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 size-4 rounded border-gray-300 accent-blue-500"
          />
          <span className="text-sm leading-snug">
            I've read and understand the above notice, and I'm not using EduSpace at
            a school with students
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

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
import { Input } from "@/shared/components/ui/input";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { joinClassroom } from "@/services/classroom-service";
import { CircleAlert } from "lucide-react";

interface JoinClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JoinClassDialog = ({ open, onOpenChange }: JoinClassDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");

  const joinMutation = useMutation({
    mutationFn: () => joinClassroom(classCode.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      handleClose();
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.error || "Failed to join classroom. Please try again.",
      );
    },
  });

  const handleClose = () => {
    setClassCode("");
    setError("");
    onOpenChange(false);
  };

  const handleJoin = () => {
    setError("");
    if (!classCode.trim()) {
      setError("Please enter a class code.");
      return;
    }
    joinMutation.mutate();
  };

  const initials = user?.profile
    ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Join class</DialogTitle>
          <DialogDescription className="sr-only">
            Enter a class code to join a classroom
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">
            You're currently signed in as
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-tight">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <h3 className="text-sm font-semibold mb-1">Class code</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Ask your teacher for the class code, then enter it below to join the
            classroom workspace.
          </p>
          <Input
            placeholder="Enter 6-character code"
            value={classCode}
            onChange={(e) => {
              setClassCode(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
          />
          {error && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <CircleAlert className="size-3" />
              {error}
            </p>
          )}
          <div className="flex items-start gap-1.5 mt-3 text-xs text-muted-foreground">
            <CircleAlert className="size-3 mt-0.5 shrink-0" />
            <div>
              <p>Use 6 letters or numbers, no spaces or symbols</p>
              <p>If you have trouble, contact your instructor</p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            disabled={!classCode.trim() || joinMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {joinMutation.isPending ? "Joining..." : "Join"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinClassDialog;

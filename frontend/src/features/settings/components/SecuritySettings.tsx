import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Lock, Eye, EyeOff, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { changePassword, deleteAccount } from "@/services/user-service";
import { getDeletionImpact } from "@/services/classroom-service";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";

const SecuritySettings = () => {
  const { logout } = useAuth();
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [classroomAction, setClassroomAction] = useState<"delete" | "transfer">("delete");
  const [impact, setImpact] = useState<{
    transferable: { id: string; name: string }[];
    deletable: { id: string; name: string }[];
  } | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccount(classroomAction),
    onSuccess: () => {
      logout();
    },
    onError: (err: any) => {
      setDeleteError(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          "Failed to delete account",
      );
    },
  });

  const openDeleteDialog = async () => {
    setDeleteOpen(true);
    setDeleteConfirmText("");
    setDeleteError("");
    setClassroomAction("delete");
    setImpact(null);
    setLoadingImpact(true);
    try {
      const data = await getDeletionImpact();
      setImpact(data);
      if (data.transferable.length > 0) {
        setClassroomAction("transfer");
      }
    } catch {
      setImpact({ transferable: [], deletable: [] });
    } finally {
      setLoadingImpact(false);
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess(false);
  };

  const mutation = useMutation({
    mutationFn: () => changePassword(passwords.current, passwords.new),
    onSuccess: () => {
      setPasswords({ current: "", new: "", confirm: "" });
      setSuccess(true);
      setError("");
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          "Failed to change password",
      );
    },
  });

  const handleSubmit = () => {
    if (!passwords.current) {
      setError("Current password is required");
      return;
    }
    if (passwords.new.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setError("New passwords do not match");
      return;
    }
    mutation.mutate();
  };

  const totalClassrooms =
    (impact?.transferable.length ?? 0) + (impact?.deletable.length ?? 0);
  const hasTransferable = (impact?.transferable.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Change Password Section */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Lock className="size-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
        </div>

        <div className="flex flex-col gap-4">
          <PasswordField
            label="Current Password"
            value={passwords.current}
            onChange={(v) => handlePasswordChange("current", v)}
            show={showCurrent}
            onToggle={() => setShowCurrent((p) => !p)}
          />

          <div className="grid grid-cols-2 gap-4">
            <PasswordField
              label="New Password"
              value={passwords.new}
              onChange={(v) => handlePasswordChange("new", v)}
              placeholder="Min. 8 characters"
              show={showNew}
              onToggle={() => setShowNew((p) => !p)}
            />
            <PasswordField
              label="Confirm New Password"
              value={passwords.confirm}
              onChange={(v) => handlePasswordChange("confirm", v)}
              placeholder="Re-type password"
              show={showConfirm}
              onToggle={() => setShowConfirm((p) => !p)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600">Password changed successfully!</p>
          )}

          <div>
            <Button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 mt-1 cursor-pointer"
            >
              {mutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="border-t border-red-200 pt-8">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="size-5 text-red-600" />
          <h2 className="text-lg font-bold text-red-600">Delete Account</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Button
          variant="outline"
          onClick={openDeleteDialog}
          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
        >
          Delete My Account
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, profile, and all
              associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {loadingImpact ? (
            <p className="text-sm text-gray-500 py-4">Checking your classrooms...</p>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {totalClassrooms > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    You own {totalClassrooms} classroom{totalClassrooms > 1 ? "s" : ""}
                  </p>

                  {impact!.deletable.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-amber-700 mb-1">
                        Will be deleted (no other admins):
                      </p>
                      <ul className="text-xs text-amber-900 list-disc list-inside">
                        {impact!.deletable.map((c) => (
                          <li key={c.id}>{c.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {hasTransferable && (
                    <div>
                      <p className="text-xs text-amber-700 mb-2">
                        These classrooms have other admins:
                      </p>
                      <ul className="text-xs text-amber-900 list-disc list-inside mb-3">
                        {impact!.transferable.map((c) => (
                          <li key={c.id}>{c.name}</li>
                        ))}
                      </ul>
                      <p className="text-sm font-medium text-amber-800 mb-2">
                        What should happen to them?
                      </p>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="classroomAction"
                            checked={classroomAction === "transfer"}
                            onChange={() => setClassroomAction("transfer")}
                            className="accent-amber-600"
                          />
                          <span className="text-sm text-amber-900">
                            Transfer ownership to another admin
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="classroomAction"
                            checked={classroomAction === "delete"}
                            onChange={() => setClassroomAction("delete")}
                            className="accent-amber-600"
                          />
                          <span className="text-sm text-amber-900">
                            Delete all my classrooms
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Type <span className="font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value);
                    setDeleteError("");
                  }}
                  placeholder="DELETE"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 transition-colors placeholder:text-gray-400"
                />
                {deleteError && (
                  <p className="text-sm text-red-500 mt-2">{deleteError}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              disabled={
                deleteConfirmText !== "DELETE" ||
                deleteMutation.isPending ||
                loadingImpact
              }
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
            >
              {deleteMutation.isPending
                ? "Deleting..."
                : "Permanently Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400 pr-10"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default SecuritySettings;

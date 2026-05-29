import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/services/user-service";

const SecuritySettings = () => {
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

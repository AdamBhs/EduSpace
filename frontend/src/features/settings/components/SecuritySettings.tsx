import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Lock,
  ShieldCheck,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";

const SecuritySettings = () => {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
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
          />

          <div className="grid grid-cols-2 gap-4">
            <PasswordField
              label="New Password"
              value={passwords.new}
              onChange={(v) => handlePasswordChange("new", v)}
              placeholder="Min. 8 characters"
            />
            <PasswordField
              label="Confirm New Password"
              value={passwords.confirm}
              onChange={(v) => handlePasswordChange("confirm", v)}
              placeholder="Re-type password"
            />
          </div>

          <div>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-5 mt-1">
              Update Password
            </Button>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Two-Factor Authentication */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">
              Two-Factor Authentication
            </h2>
          </div>
          <span
            className={`text-xs font-bold tracking-wider px-2 py-0.5 rounded ${
              twoFactorEnabled
                ? "text-green-600 bg-green-50 border border-green-200"
                : "text-gray-500 bg-gray-100 border border-gray-200"
            }`}
          >
            {twoFactorEnabled ? "ENABLED" : "DISABLED"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4 ml-7">
          Two-factor authentication adds an extra layer of security to your account
          by requiring more than just a password to log in.
        </p>
        <div className="ml-7">
          <ToggleSwitch
            enabled={twoFactorEnabled}
            onToggle={() => setTwoFactorEnabled((prev) => !prev)}
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Active Sessions */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Monitor className="size-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Active Sessions</h2>
        </div>

        <div className="flex flex-col gap-1">
          <SessionItem
            icon={<Monitor className="size-5 text-gray-500" />}
            name="Chrome on macOS"
            location="San Francisco, USA"
            detail="192.168.1.1"
            isCurrent
          />
          <SessionItem
            icon={<Smartphone className="size-5 text-gray-500" />}
            name="EduFlow App on iPhone 15"
            location="San Francisco, USA"
            detail="October 24, 2025"
          />
          <SessionItem
            icon={<Tablet className="size-5 text-gray-500" />}
            name="Safari on iPad Pro"
            location="London, UK"
            detail="October 20, 2025"
          />
        </div>

        <button className="text-sm text-red-500 hover:text-red-600 font-medium mt-4 cursor-pointer">
          Log out from all other devices
        </button>
      </div>
    </div>
  );
};

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400"
      />
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
        enabled ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
      {enabled && (
        <svg
          className="absolute left-1.5 size-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );
}

function SessionItem({
  icon,
  name,
  location,
  detail,
  isCurrent,
}: {
  icon: React.ReactNode;
  name: string;
  location: string;
  detail: string;
  isCurrent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{name}</p>
          {isCurrent && (
            <span className="text-[10px] font-bold tracking-wider text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
              CURRENT
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {location} • {detail}
        </p>
      </div>
      {isCurrent ? (
        <span className="text-xs text-gray-400 italic">Current Session</span>
      ) : (
        <button className="text-sm text-red-500 hover:text-red-600 font-medium cursor-pointer">
          Log out
        </button>
      )}
    </div>
  );
}

export default SecuritySettings;

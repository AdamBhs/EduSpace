import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { uploadFile } from "@/services/user-service";

const ProfileSettings = () => {
  const { user, token, setAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    fullName: user?.profile
      ? `${user.profile.firstName ?? ""} ${user.profile.lastName ?? ""}`.trim()
      : "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    bio: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    setProfileImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleRemoveImage = () => {
    setProfileImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (profileImageUrl) URL.revokeObjectURL(profileImageUrl);
    };
  }, [profileImageUrl]);

  const handleUpdatedChanges = async () => {
    if (!selectedFile) return;
    const resolvedUserId =
      user?.userId ?? user?.id ?? user?.user_id ?? user?.profile?.userId ?? null;
    const response = await uploadFile(
      selectedFile,
      resolvedUserId ? String(resolvedUserId) : undefined,
    );
    const avatarUrl =
      response?.data?.avatarUrl ??
      response?.data?.key ??
      response?.avatarUrl ??
      response?.key ??
      null;
    if (avatarUrl && user && token) {
      const updatedUser = {
        ...user,
        profile: {
          ...(user.profile ?? {}),
          avatarUrl,
        },
      };
      setAuth(token, updatedUser);
    }
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Profile Picture */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#d4c5a9] flex items-center justify-center overflow-hidden shrink-0">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-12 h-12 text-[#5c5040]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Profile Picture</p>
          <p className="text-xs text-gray-500 mt-0.5">
            JPG, GIF or PNG. Max size of 800K.
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Button
              type="button"
              onClick={handleUploadClick}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-8 px-4 rounded-md cursor-pointer"
            >
              Upload New
            </Button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Full Name & Username */}
      <div className="grid grid-cols-2 gap-6">
        <SettingsField
          label="Full Name"
          value={form.fullName}
          onChange={(v) => handleChange("fullName", v)}
        />
        <SettingsField
          label="Username"
          value={form.username}
          onChange={(v) => handleChange("username", v)}
          prefix="@"
        />
      </div>

      {/* Email Address */}
      <SettingsField
        label="Email Address"
        value={form.email}
        onChange={(v) => handleChange("email", v)}
        type="email"
      />

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">Bio</label>
          <span className="text-xs text-gray-400">
            {form.bio.length} / 200 CHARACTERS
          </span>
        </div>
        <textarea
          value={form.bio}
          onChange={(e) => {
            if (e.target.value.length <= 200)
              handleChange("bio", e.target.value);
          }}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors resize-none"
          placeholder="Tell us about yourself..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" className="text-gray-600">
          Cancel Changes
        </Button>
        <Button
          onClick={handleUpdatedChanges}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

function SettingsField({
  label,
  value,
  onChange,
  type = "text",
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border border-gray-300 rounded-lg py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors ${
            prefix ? "pl-7 pr-3" : "px-3"
          }`}
        />
      </div>
    </div>
  );
}

export default ProfileSettings;

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { uploadProfilePicture, updateProfile } from "@/services/user-service";
import { useMutation } from "@tanstack/react-query";

const ProfileSettings = () => {
  const { user, token, setAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    user?.profile?.avatarUrl ?? null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    firstName: user?.profile?.firstName ?? "",
    lastName: user?.profile?.lastName ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.profile?.phoneNumber ?? "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (profileImageUrl && profileImageUrl.startsWith("blob:"))
        URL.revokeObjectURL(profileImageUrl);
    };
  }, [profileImageUrl]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleCancel = () => {
    setForm({
      firstName: user?.profile?.firstName ?? "",
      lastName: user?.profile?.lastName ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.profile?.phoneNumber ?? "",
    });
    setProfileImageUrl(user?.profile?.avatarUrl ?? null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSaved(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setProfileImageUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleRemoveImage = () => {
    setProfileImageUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let newAvatarUrl = user?.profile?.avatarUrl ?? null;

      if (selectedFile) {
        const response = await uploadProfilePicture(selectedFile);
        newAvatarUrl =
          response?.avatarUrl ?? response?.data?.avatarUrl ?? response?.key ?? newAvatarUrl;
      }

      const profileRes = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber || undefined,
      });

      return { profileRes, newAvatarUrl };
    },
    onSuccess: ({ profileRes, newAvatarUrl }) => {
      if (user && token) {
        const updatedUser = {
          ...user,
          profile: {
            ...(user.profile ?? {}),
            firstName: profileRes?.profile?.firstName ?? form.firstName,
            lastName: profileRes?.profile?.lastName ?? form.lastName,
            phoneNumber: profileRes?.profile?.phoneNumber ?? form.phoneNumber,
            avatarUrl: newAvatarUrl,
          },
        };
        setAuth(token, updatedUser);
      }
      setSelectedFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Profile Picture */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#d4c5a9] flex items-center justify-center overflow-hidden shrink-0">
          {profileImageUrl ? (
            <img
              src={profileImageUrl ?? undefined}
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

      {/* First Name & Last Name */}
      <div className="grid grid-cols-2 gap-6">
        <SettingsField
          label="First Name"
          value={form.firstName}
          onChange={(v) => handleChange("firstName", v)}
        />
        <SettingsField
          label="Last Name"
          value={form.lastName}
          onChange={(v) => handleChange("lastName", v)}
        />
      </div>

      {/* Email Address (read-only) */}
      <SettingsField
        label="Email Address"
        value={form.email}
        type="email"
        readOnly
      />

      {/* Phone Number */}
      <SettingsField
        label="Phone Number"
        value={form.phoneNumber}
        onChange={(v) => handleChange("phoneNumber", v)}
        placeholder="Optional"
      />

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-3 pt-4">
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved!</span>
        )}
        {saveMutation.isError && (
          <span className="text-sm text-red-500">Failed to save</span>
        )}
        <Button
          variant="ghost"
          className="text-gray-600 cursor-pointer"
          onClick={handleCancel}
        >
          Cancel Changes
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 cursor-pointer"
        >
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
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
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  prefix?: string;
  placeholder?: string;
  readOnly?: boolean;
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
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full border border-gray-300 rounded-lg py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors ${
            prefix ? "pl-7 pr-3" : "px-3"
          } ${readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  );
}

export default ProfileSettings;

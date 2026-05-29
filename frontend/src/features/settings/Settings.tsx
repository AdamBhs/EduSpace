import { useEffect, useState } from "react";
import { User, Shield, Bell } from "lucide-react";
import ProfileSettings from "./components/ProfileSettings";
import SecuritySettings from "./components/SecuritySettings";
import NotificationSettings from "./components/NotificationSettings";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "settings", label: "Profile Settings", icon: User },
  { id: "security", label: "security", icon: Shield },
  { id: "notifications", label: "notifications", icon: Bell },
] as const;

type TabId = (typeof tabs)[number]["id"];

const Settings = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const arrayLocation = location.pathname
    .split("/")
    .filter((item) => item !== "");
  const settingsLocation =
    arrayLocation.length == 2 ? arrayLocation[1] : arrayLocation[0];

  const stateTab = (location.state as { tab?: TabId } | null)?.tab;
  const locationTab =
    settingsLocation === "settings" ||
    settingsLocation === "security" ||
    settingsLocation === "notifications"
      ? settingsLocation
      : "settings";

  const [activeTab, setActiveTab] = useState<TabId>(
    stateTab ?? locationTab ?? "settings"
  );

  useEffect(() => {
    setActiveTab(stateTab ?? locationTab ?? "settings");
  }, [stateTab, locationTab]);

  const title =
    activeTab === "settings"
      ? "Account Settings"
      : activeTab === "security"
        ? "Security Settings"
        : "Notification Settings";

  const subtitle =
    activeTab === "settings"
      ? "Manage your account preferences and profile information."
      : activeTab === "security"
        ? "Manage your account security and active sessions."
        : "Manage your notification preferences.";

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "settings") {
                  navigate("/settings");
                  setActiveTab(tab.id);
                } else {
                  navigate(`/settings/${tab.id}`);
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center gap-1.5 pb-3 text-sm font-medium cursor-pointer transition-colors border-b-2 ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {settingsLocation === "settings" && <ProfileSettings />}
      {settingsLocation === "security" && <SecuritySettings />}
      {settingsLocation === "notifications" && <NotificationSettings />}
    </div>
  );
};

export default Settings;

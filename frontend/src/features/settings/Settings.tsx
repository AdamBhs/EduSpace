import { useEffect, useState } from "react";
import { User, Shield, Bell } from "lucide-react";
import { useLocation } from "react-router-dom";
import ProfileSettings from "./components/ProfileSettings";
import SecuritySettings from "./components/SecuritySettings";
import NotificationSettings from "./components/NotificationSettings";

const tabs = [
  { id: "profile", label: "Profile Settings", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type TabId = (typeof tabs)[number]["id"];

const Settings = () => {
  const location = useLocation();
  const locationState = location.state as { settingsTab?: TabId } | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    locationState?.settingsTab ?? "profile",
  );

  useEffect(() => {
    if (locationState?.settingsTab && locationState.settingsTab !== activeTab) {
      setActiveTab(locationState.settingsTab);
    }
  }, [locationState?.settingsTab, activeTab]);

  const title =
    activeTab === "profile"
      ? "Account Settings"
      : activeTab === "security"
        ? "Security Settings"
        : "Notification Settings";

  const subtitle =
    activeTab === "profile"
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
              onClick={() => setActiveTab(tab.id)}
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
      {activeTab === "profile" && <ProfileSettings />}
      {activeTab === "security" && <SecuritySettings />}
      {activeTab === "notifications" && <NotificationSettings />}
    </div>
  );
};

export default Settings;

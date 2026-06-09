import { useState, useEffect } from "react";
import {
  Bell,
  FileText,
  CalendarClock,
  Award,
  MessageSquare,
} from "lucide-react";

const STORAGE_KEY = "eduspace_notification_prefs";

const NOTIFICATION_TYPES = [
  {
    key: "POST_CREATED",
    label: "New Posts",
    description: "When an admin creates a new post in your classroom",
    icon: FileText,
    color: "#2563eb",
  },
  {
    key: "ASSIGNMENT_DUE",
    label: "Assignment Reminders",
    description: "Reminders when an assignment due date is approaching",
    icon: CalendarClock,
    color: "#f59e0b",
  },
  {
    key: "SUBMISSION_GRADED",
    label: "Grades",
    description: "When your submission has been graded",
    icon: Award,
    color: "#16a34a",
  },
  {
    key: "CHAT_MESSAGE",
    label: "Chat Messages",
    description: "When someone sends a message in classroom chat",
    icon: MessageSquare,
    color: "#ec4899",
  },
] as const;

type Preferences = Record<string, boolean>;

function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const defaults: Preferences = {};
  for (const t of NOTIFICATION_TYPES) defaults[t.key] = true;
  return defaults;
}

export function getNotificationPreferences(): Preferences {
  return loadPreferences();
}

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggle = (key: string) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const enabledCount = Object.values(prefs).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs text-green-600 font-medium">Saved</span>
          )}
          <span className="text-xs text-gray-400">
            {enabledCount}/{NOTIFICATION_TYPES.length} enabled
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-500 -mt-2">
        Choose which notifications you want to see. Disabled notifications won't appear in your notification list.
      </p>

      <div className="flex flex-col gap-1">
        {NOTIFICATION_TYPES.map((type) => {
          const Icon = type.icon;
          const enabled = prefs[type.key] !== false;
          return (
            <div
              key={type.key}
              className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                enabled ? "bg-white" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    background: enabled ? `${type.color}15` : "#f1f5f9",
                  }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: enabled ? type.color : "#94a3b8" }}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${enabled ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {type.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggle(type.key)}
                className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
                  enabled ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationSettings;

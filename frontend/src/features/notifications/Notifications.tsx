import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/services/notification-service";
import { getNotificationPreferences } from "@/features/settings/components/NotificationSettings";
import { Button } from "@/shared/components/ui/button";
import { Bell, Trash2, CheckCheck, Settings } from "lucide-react";
import { formatDateTime } from "@/shared/lib/utils";
import type { Notification } from "@/shared/types";

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: raw, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", "all"],
    queryFn: () => getNotifications({ limit: 100 }),
  });

  const prefs = getNotificationPreferences();
  const notifications = (Array.isArray(raw) ? raw : []).filter(
    (n) => prefs[n.type] !== false,
  );

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings/notifications")}
            className="text-xs text-gray-500"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Settings
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-lg px-4 py-3 cursor-pointer transition-colors group ${
                n.isRead ? "hover:bg-gray-50" : "bg-blue-50/50 hover:bg-blue-50"
              }`}
              onClick={() => {
                if (!n.isRead) readMutation.mutate(n.id);
                if (n.postId && n.classId) navigate(`/c/${n.classId}/post/${n.postId}`);
                else if (n.classId) navigate(`/c/${n.classId}/stream`);
              }}
            >
              <span
                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                  n.isRead ? "bg-transparent border border-gray-200" : "bg-blue-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.isRead ? "text-gray-700" : "text-gray-900 font-medium"}`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(n.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

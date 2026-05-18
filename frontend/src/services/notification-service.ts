import { api } from "./axios";

export const getNotifications = async (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) => {
  const response = await api.get("/notifications/api/notifications", { params });
  return response.data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get("/notifications/api/notifications/unread-count");
  return response.data.data.count;
};

export const markAsRead = async (notificationId: string) => {
  const response = await api.put(`/notifications/api/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.put("/notifications/api/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (notificationId: string) => {
  const response = await api.delete(`/notifications/api/notifications/${notificationId}`);
  return response.data;
};

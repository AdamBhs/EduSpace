import { api } from "./axios";
import type { ChatMessage, MessageReadState } from "@/shared/types";

export const getMessages = async (
  classId: string,
  cursor?: string,
  limit = 50,
): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> => {
  const response = await api.get(`/chat/api/chat/${classId}/messages`, {
    params: { cursor, limit },
  });
  return response.data.data;
};

export const getChatSharedFiles = async (
  classId: string,
): Promise<{ id: string; senderId: string; fileKey: string; fileName: string; createdAt: string }[]> => {
  const response = await api.get(`/chat/api/chat/${classId}/files`);
  return response.data.data;
};

export const getChatSharedLinks = async (
  classId: string,
): Promise<{ id: string; senderId: string; url: string; createdAt: string }[]> => {
  const response = await api.get(`/chat/api/chat/${classId}/links`);
  return response.data.data;
};

export const getChatReads = async (
  classId: string,
): Promise<MessageReadState[]> => {
  const response = await api.get(`/chat/api/chat/${classId}/reads`);
  return response.data.data;
};

export const getChatPinned = async (
  classId: string,
): Promise<ChatMessage[]> => {
  const response = await api.get(`/chat/api/chat/${classId}/pinned`);
  return response.data.data;
};

export const getChatUnread = async (
  classId: string,
): Promise<{ count: number }> => {
  const response = await api.get(`/chat/api/chat/${classId}/unread`);
  return response.data.data;
};

export const getChatInfo = async (classId: string) => {
  const response = await api.get(`/chat/api/chat/${classId}/info`);
  return response.data.data;
};

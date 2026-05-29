import { api } from "./axios";
import type { ChatMessage } from "@/shared/types";

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

export const getChatInfo = async (classId: string) => {
  const response = await api.get(`/chat/api/chat/${classId}/info`);
  return response.data.data;
};

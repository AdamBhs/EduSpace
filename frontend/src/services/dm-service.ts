import { api } from "./axios";
import type { DirectConversation, DirectMessage } from "@/shared/types";

export const getConversations = async (): Promise<DirectConversation[]> => {
  const response = await api.get("/dm/api/dm/conversations");
  return response.data.data;
};

export const createConversation = async (
  otherUserId: string,
): Promise<DirectConversation> => {
  const response = await api.post("/dm/api/dm/conversations", { otherUserId });
  return response.data.data;
};

export const getDmMessages = async (
  conversationId: string,
  cursor?: string,
  limit = 50,
): Promise<{ messages: DirectMessage[]; nextCursor: string | null }> => {
  const response = await api.get(
    `/dm/api/dm/conversations/${conversationId}/messages`,
    { params: { cursor, limit } },
  );
  return response.data.data;
};

export const getFriends = async (): Promise<string[]> => {
  const response = await api.get("/dm/api/dm/friends");
  return response.data.data;
};

export const getFriendsWithStatus = async (): Promise<
  { userId: string; online: boolean }[]
> => {
  const response = await api.get("/dm/api/dm/friends/status");
  return response.data.data;
};

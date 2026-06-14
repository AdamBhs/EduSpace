import { api } from "./axios";
import type { DirectConversation, DirectMessage, MessageReadState } from "@/shared/types";

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

export const getConversation = async (
  conversationId: string,
): Promise<Pick<DirectConversation, "id" | "otherUserId" | "createdAt" | "updatedAt">> => {
  const response = await api.get(`/dm/api/dm/conversations/${conversationId}`);
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

export const getDmReads = async (
  conversationId: string,
): Promise<MessageReadState[]> => {
  const response = await api.get(
    `/dm/api/dm/conversations/${conversationId}/reads`,
  );
  return response.data.data;
};

export const getDmPinned = async (
  conversationId: string,
): Promise<DirectMessage[]> => {
  const response = await api.get(
    `/dm/api/dm/conversations/${conversationId}/pinned`,
  );
  return response.data.data;
};

export const getDmSharedFiles = async (
  conversationId: string,
): Promise<{ id: string; senderId: string; fileKey: string; fileName: string; createdAt: string }[]> => {
  const response = await api.get(
    `/dm/api/dm/conversations/${conversationId}/files`,
  );
  return response.data.data;
};

export const getDmSharedLinks = async (
  conversationId: string,
): Promise<{ id: string; senderId: string; url: string; createdAt: string }[]> => {
  const response = await api.get(
    `/dm/api/dm/conversations/${conversationId}/links`,
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

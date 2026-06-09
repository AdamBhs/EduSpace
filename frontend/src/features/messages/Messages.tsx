import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getConversations, getFriends, createConversation } from "@/services/dm-service";
import { getUsers } from "@/services/user-service";
import { useAuth } from "@/context/AuthContext";
import {
  Avatar,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import { MessageSquare, Search, Plus, X } from "lucide-react";
import type { DirectConversation, UserSummary } from "@/shared/types";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNewChat, setShowNewChat] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");

  const { data: conversations, isLoading } = useQuery<DirectConversation[]>({
    queryKey: ["dm-conversations"],
    queryFn: getConversations,
  });

  const conversationUserIds = (conversations ?? []).map((c) => c.otherUserId);

  const { data: conversationUsers } = useQuery<Map<string, UserSummary>>({
    queryKey: ["users", "dm-conversations", conversationUserIds.sort().join(",")],
    queryFn: async () => {
      if (conversationUserIds.length === 0) return new Map();
      const users = await getUsers(conversationUserIds);
      return new Map(users.map((u) => [u.userId, u]));
    },
    enabled: conversationUserIds.length > 0,
  });

  const { data: friendIds } = useQuery<string[]>({
    queryKey: ["dm-friends"],
    queryFn: getFriends,
    enabled: showNewChat,
  });

  const { data: friendUsers } = useQuery<Map<string, UserSummary>>({
    queryKey: ["users", "dm-friends", (friendIds ?? []).sort().join(",")],
    queryFn: async () => {
      if (!friendIds || friendIds.length === 0) return new Map();
      const users = await getUsers(friendIds);
      return new Map(users.map((u) => [u.userId, u]));
    },
    enabled: !!friendIds && friendIds.length > 0,
  });

  const existingConversationPartners = new Set(conversationUserIds);

  const filteredFriends = friendIds
    ?.map((id) => friendUsers?.get(id))
    .filter((u): u is UserSummary => {
      if (!u) return false;
      if (existingConversationPartners.has(u.userId)) return false;
      if (!friendSearch) return true;
      const name = `${u.userName ?? ""} ${u.userLastName ?? ""}`.toLowerCase();
      return name.includes(friendSearch.toLowerCase());
    }) ?? [];

  const startConversation = async (otherUserId: string) => {
    const conv = await createConversation(otherUserId);
    setShowNewChat(false);
    setFriendSearch("");
    navigate(`/messages/${conv.id}`);
  };

  const userName = (u: UserSummary | undefined) => {
    if (!u) return "Unknown";
    return `${u.userName ?? ""} ${u.userLastName ?? ""}`.trim() || "Unknown";
  };

  const userInitials = (u: UserSummary | undefined) => {
    if (!u) return "?";
    return `${u.userName?.[0] ?? ""}${u.userLastName?.[0] ?? ""}`.toUpperCase() || "?";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 86400000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < oneDay * 2) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            {conversations?.length
              ? `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`
              : "No conversations yet"}
          </p>
        </div>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#137FEC] hover:bg-[#1171d4] cursor-pointer transition-colors"
        >
          {showNewChat ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showNewChat ? "Cancel" : "New"}
        </button>
      </div>

      {showNewChat && (
        <div className="mb-6 border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 bg-[#F8FAFC] rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Search classmates..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#CBD5E1]"
              autoFocus
            />
          </div>

          {!friendIds ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
          ) : filteredFriends.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {friendSearch ? "No matching classmates" : "No new classmates to message"}
            </p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filteredFriends.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => startConversation(u.userId)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#F1F5F9] cursor-pointer transition-colors text-left"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-semibold">
                      {userInitials(u)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-[#0F172A]">{userName(u)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
      ) : !conversations || conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No messages yet</p>
          <p className="text-xs text-gray-300 mt-1">
            Start a conversation with a classmate
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => {
            const otherUser = conversationUsers?.get(conv.otherUserId);
            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-[#F1F5F9] cursor-pointer transition-colors text-left"
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                    {userInitials(otherUser)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0F172A] truncate">
                      {userName(otherUser)}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-[#94A3B8] shrink-0 ml-2">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] truncate mt-0.5">
                    {conv.lastMessage
                      ? conv.lastMessage.senderId === user?.userId
                        ? `You: ${conv.lastMessage.content ?? "Sent a file"}`
                        : conv.lastMessage.content ?? "Sent a file"
                      : "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Messages;

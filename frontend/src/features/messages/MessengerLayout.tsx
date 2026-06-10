import { useState } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getConversations, getFriends, getFriendsWithStatus, createConversation } from "@/services/dm-service";
import { getUsers } from "@/services/user-service";
import { useAuth } from "@/context/AuthContext";
import {
  Avatar,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Search, Plus, X, MessageSquare, Users } from "lucide-react";
import type { DirectConversation, UserSummary } from "@/shared/types";

const MessengerLayout = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [showNewChat, setShowNewChat] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [showStatus, setShowStatus] = useState(false);

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

  const { data: friendsWithStatus } = useQuery({
    queryKey: ["friends-status"],
    queryFn: getFriendsWithStatus,
    refetchInterval: 30000,
  });

  const statusFriendIds = friendsWithStatus?.map((f) => f.userId) ?? [];

  const { data: statusUsers } = useQuery<UserSummary[]>({
    queryKey: ["users", statusFriendIds],
    queryFn: () => getUsers(statusFriendIds),
    enabled: statusFriendIds.length > 0,
  });

  const statusUserMap = new Map(statusUsers?.map((u) => [u.userId, u]) ?? []);
  const onlineSet = new Set(friendsWithStatus?.filter((f) => f.online).map((f) => f.userId) ?? []);

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

  const onlineCount = friendsWithStatus?.filter((f) => f.online).length ?? 0;
  const hasStatus = friendsWithStatus && friendsWithStatus.length > 0;

  return (
    <div className="flex h-[calc(100vh-60px-16px)] -my-5 -mx-6">
      {/* Left sidebar */}
      <div className="w-80 border-r border-[#E2E8F0] flex flex-col bg-white shrink-0">
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[#0F172A]">Messenger</h1>
            <div className="flex items-center gap-1">
              {hasStatus && (
                <button
                  onClick={() => setShowStatus(!showStatus)}
                  className={`p-1.5 rounded-full cursor-pointer transition-colors ${showStatus ? "bg-[#E8F4FD] text-[#137FEC]" : "hover:bg-[#F1F5F9] text-[#64748B]"}`}
                  title="Active status"
                >
                  <Users className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="p-1.5 rounded-full hover:bg-[#F1F5F9] cursor-pointer transition-colors"
                title={showNewChat ? "Cancel" : "New conversation"}
              >
                {showNewChat ? <X className="w-5 h-5 text-[#64748B]" /> : <Plus className="w-5 h-5 text-[#64748B]" />}
              </button>
            </div>
          </div>

          {showNewChat && (
            <div className="mb-3 border border-[#E2E8F0] rounded-xl p-3">
              <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-lg px-3 py-2 mb-2">
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
                <p className="text-xs text-gray-400 text-center py-2">Loading...</p>
              ) : filteredFriends.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">
                  {friendSearch ? "No matching classmates" : "No new classmates to message"}
                </p>
              ) : (
                <div className="space-y-0.5 max-h-40 overflow-y-auto">
                  {filteredFriends.map((u) => (
                    <button
                      key={u.userId}
                      onClick={() => startConversation(u.userId)}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#F1F5F9] cursor-pointer text-left"
                    >
                      <Avatar className="w-7 h-7">
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
        </div>

        {/* Conversations + Active Status */}
        <ScrollArea className="flex-1">
          {/* Conversations */}
          <div className="px-2">
            {isLoading ? (
              <p className="text-xs text-gray-400 text-center py-6">Loading...</p>
            ) : !conversations || conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {conversations.map((conv) => {
                  const otherUser = conversationUsers?.get(conv.otherUserId);
                  const isActive = conv.id === conversationId;
                  const isOnline = onlineSet.has(conv.otherUserId);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => navigate(`/messages/${conv.id}`)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors text-left ${
                        isActive ? "bg-[#E8F4FD]" : "hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                            {userInitials(otherUser)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            isOnline ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                      </div>
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

        </ScrollArea>
      </div>

      {/* Center: chat area or empty state */}
      <div className="flex-1 min-w-0">
        {conversationId ? (
          <Outlet />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-[#94A3B8]">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Active Status panel */}
      {showStatus && hasStatus && (
        <div className="w-60 border-l border-[#E2E8F0] flex flex-col bg-white shrink-0">
          <div className="px-4 py-4 border-b border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0F172A]">Active Status</h2>
              {onlineCount > 0 && (
                <span className="text-xs text-green-600 font-medium">{onlineCount} online</span>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-2 py-2 space-y-0.5">
              {friendsWithStatus!.map((friend) => {
                const u = statusUserMap.get(friend.userId);
                return (
                  <button
                    key={friend.userId}
                    onClick={() => startConversation(friend.userId)}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[#F1F5F9] cursor-pointer transition-colors text-left"
                  >
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback
                          className={`text-[10px] font-semibold ${
                            friend.online
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {userInitials(u)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          friend.online ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{userName(u)}</p>
                      <p className={`text-[11px] ${friend.online ? "text-green-600" : "text-[#94A3B8]"}`}>
                        {friend.online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default MessengerLayout;

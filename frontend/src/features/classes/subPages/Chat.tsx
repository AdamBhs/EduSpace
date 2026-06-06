import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClassroomById, getMembers } from "@/services/classroom-service";
import { getMessages } from "@/services/chat-service";
import { getUsers } from "@/services/user-service";
import { getFileUrl, uploadFile } from "@/services/file-service";
import { connectSocket, disconnectSocket } from "@/services/websocket";
import NavLinksClass from "../components/NavLinksClass";
import {
  Avatar,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Info,
  Paperclip,
  Send,
  Download,
  Loader2,
} from "lucide-react";
import type { Classroom, ChatMessage, Member, UserSummary } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";

const Chat = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasScrolledRef = useRef(false);

  const {
    data: classroom,
    isLoading: classLoading,
    error: classError,
  } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", classId],
    queryFn: () => getMembers(classId!),
    enabled: !!classId,
  });

  const memberList: Member[] = membersData?.members ?? [];
  const memberUserIds = memberList.map((m) => m.userId);

  const { data: userMap } = useQuery<Map<string, UserSummary>>({
    queryKey: ["users", memberUserIds.sort().join(",")],
    queryFn: async () => {
      if (memberUserIds.length === 0) return new Map();
      const users = await getUsers(memberUserIds);
      return new Map(users.map((u) => [u.userId, u]));
    },
    enabled: memberUserIds.length > 0,
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!classId || !classroom?.chatEnabled) return;

    getMessages(classId).then((data) => {
      setMessages(data.messages);
      setNextCursor(data.nextCursor);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        hasScrolledRef.current = true;
      }, 50);
    });

    const socket = connectSocket();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", classId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("new-message", (msg: ChatMessage) => {
      if (msg.classId === classId) {
        setMessages((prev) => [...prev, msg]);
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(msg.senderId);
          return next;
        });
        setTimeout(scrollToBottom, 50);
      }
    });

    socket.on("presence-update", (userIds: string[]) => {
      setOnlineUserIds(userIds);
    });

    socket.on("user-typing", ({ userId: typerId }: { userId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(typerId));
    });

    socket.on("user-stop-typing", ({ userId: typerId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(typerId);
        return next;
      });
    });

    return () => {
      socket.emit("leave-room", classId);
      socket.off("new-message");
      socket.off("presence-update");
      socket.off("user-typing");
      socket.off("user-stop-typing");
      socket.off("connect");
      socket.off("disconnect");
      disconnectSocket();
    };
  }, [classId, classroom?.chatEnabled, scrollToBottom]);

  const loadOlderMessages = async () => {
    if (!nextCursor || loadingMore || !classId) return;
    setLoadingMore(true);

    const scrollEl = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    const prevHeight = scrollEl?.scrollHeight ?? 0;

    const data = await getMessages(classId, nextCursor);
    setMessages((prev) => [...data.messages, ...prev]);
    setNextCursor(data.nextCursor);
    setLoadingMore(false);

    requestAnimationFrame(() => {
      if (scrollEl) {
        scrollEl.scrollTop = scrollEl.scrollHeight - prevHeight;
      }
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 100 && nextCursor && !loadingMore) {
      loadOlderMessages();
    }
  };

  const sendMessage = () => {
    const text = message.trim();
    if (!text || !classId) return;

    const socket = connectSocket();
    socket.emit("send-message", { classId, content: text });
    socket.emit("stop-typing", classId);
    setMessage("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classId) return;
    e.target.value = "";

    try {
      const uploaded = await uploadFile(file);
      const socket = connectSocket();
      socket.emit("send-message", {
        classId,
        fileKey: uploaded.fileKey,
        fileName: uploaded.fileName,
      });
    } catch {
      // upload failed
    }
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    const url = await getFileUrl(fileKey);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      return;
    }
    if (classId) {
      const socket = connectSocket();
      socket.emit("typing", classId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop-typing", classId);
      }, 2000);
    }
  };

  const userName = (userId: string) => {
    const u = userMap?.get(userId);
    if (u) return `${u.userName ?? ""} ${u.userLastName ?? ""}`.trim() || "Unknown";
    if (userId === user?.userId && user.profile) {
      return `${user.profile.firstName ?? ""} ${user.profile.lastName ?? ""}`.trim() || "You";
    }
    return "Unknown";
  };

  const userInitials = (userId: string) => {
    const u = userMap?.get(userId);
    if (u) return `${u.userName?.[0] ?? ""}${u.userLastName?.[0] ?? ""}`.toUpperCase() || "?";
    if (userId === user?.userId && user.profile) {
      return `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase() || "?";
    }
    return "?";
  };

  if (classLoading) return <div className="p-6 text-sm text-[#64748B]">Loading...</div>;
  if (classError) return <div className="p-6 text-sm text-red-500">Error loading classroom</div>;

  if (!classroom?.chatEnabled) {
    return (
      <div className="flex h-full -mx-6 items-stretch overflow-hidden">
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="px-6">
            <NavLinksClass
              classId={classId!}
              activeTab="Chat"
              classroomType={classroom!.type}
              userRole={classroom!.userRole!}
              chatEnabled={classroom!.chatEnabled}
            />
          </div>
          <div className="flex items-center justify-center flex-1 text-gray-400">
            Chat is disabled for this classroom
          </div>
        </section>
      </div>
    );
  }

  const myInitials = user?.profile
    ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  const onlineSet = new Set(onlineUserIds);

  const typingNames = [...typingUsers]
    .filter((id) => id !== user?.userId)
    .map((id) => userName(id).split(" ")[0]);

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="px-6">
          <NavLinksClass
            classId={classId!}
            activeTab="Chat"
            classroomType={classroom!.type}
            userRole={classroom!.userRole!}
            chatEnabled={classroom!.chatEnabled}
          />
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Chat Area */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A] leading-tight">
                    {classroom?.name}
                  </h2>
                  <p className="text-[11px] text-[#94A3B8]">
                    {connected ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                        {onlineUserIds.length} online &middot; {classroom?._count?.members ?? 0} members
                      </>
                    ) : (
                      "Connecting..."
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMembers((p) => !p)}
                className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
                  showMembers
                    ? "bg-[#137FEC]/10 text-[#137FEC]"
                    : "hover:bg-[#F1F5F9] text-[#94A3B8]"
                }`}
                title="Toggle members"
              >
                <Info className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Messages area */}
            <ScrollArea
              ref={scrollAreaRef}
              className="flex-1"
              onScrollCapture={handleScroll}
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {nextCursor && (
                  <button
                    onClick={loadOlderMessages}
                    disabled={loadingMore}
                    className="self-center text-xs text-[#137FEC] hover:underline mb-2 cursor-pointer disabled:opacity-50"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load older messages"}
                  </button>
                )}

                {messages.length === 0 && (
                  <p className="text-sm text-[#94A3B8] text-center py-10">
                    No messages yet. Start the conversation!
                  </p>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.userId;
                  const showAvatar =
                    i === 0 || messages[i - 1].senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${showAvatar ? "mt-3" : "mt-0.5"}`}
                    >
                      <div className="w-8 shrink-0">
                        {showAvatar && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback
                              className={`text-[10px] font-semibold ${
                                isMe
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {userInitials(msg.senderId)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-[#0F172A]">
                              {isMe ? "You" : userName(msg.senderId)}
                            </span>
                            <span className="text-[10px] text-[#94A3B8]">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-sm text-[#334155] break-words">
                            {msg.content}
                          </p>
                        )}
                        {msg.fileKey && msg.fileName && (
                          <button
                            onClick={() => handleDownload(msg.fileKey!, msg.fileName!)}
                            className="mt-1 flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC] hover:border-[#137FEC]/40 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-[#137FEC]" />
                            <span className="truncate text-[#334155]">{msg.fileName}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Typing indicator */}
            {typingNames.length > 0 && (
              <div className="px-5 py-1.5 flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <span>
                  {typingNames.length === 1
                    ? `${typingNames[0]} is typing`
                    : `${typingNames.join(", ")} are typing`}
                </span>
                <span className="flex items-end gap-[3px] h-4">
                  <span className="w-1 h-1 rounded-full bg-[#94A3B8]" style={{ animation: "typing-dot 1.2s infinite 0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-[#94A3B8]" style={{ animation: "typing-dot 1.2s infinite 200ms" }} />
                  <span className="w-1 h-1 rounded-full bg-[#94A3B8]" style={{ animation: "typing-dot 1.2s infinite 400ms" }} />
                </span>
              </div>
            )}

            {/* Message input */}
            <div className="border-t border-[#E2E8F0] bg-white px-4 py-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-semibold">
                    {myInitials}
                  </AvatarFallback>
                </Avatar>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${classroom?.name}...`}
                  className="flex-1 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none bg-transparent"
                  disabled={!connected}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] cursor-pointer"
                  title="Attach file"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || !connected}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#137FEC] hover:bg-[#1171d4] text-white cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Members sidebar */}
          {showMembers && (
            <div className="flex flex-col h-full w-56 border-l border-[#E2E8F0] bg-white">
              <div className="flex border-b border-[#E2E8F0]">
                <div className="flex-1 py-2.5 text-xs font-semibold tracking-wide text-[#137FEC] border-b-2 border-[#137FEC] text-center">
                  MEMBERS ({memberList.length})
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-3 py-3 space-y-1">
                  {memberList
                    .sort((a, b) => {
                      const aOn = onlineSet.has(a.userId) ? 0 : 1;
                      const bOn = onlineSet.has(b.userId) ? 0 : 1;
                      return aOn - bOn;
                    })
                    .map((member) => {
                      const isOnline = onlineSet.has(member.userId);
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
                        >
                          <div className="relative">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback
                                className={`text-[10px] font-semibold ${
                                  isOnline
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {userInitials(member.userId)}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                isOnline ? "bg-green-500" : "bg-gray-300"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${isOnline ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                              {member.userId === user?.userId ? "You" : userName(member.userId)}
                            </p>
                            <p className="text-[10px] text-[#94A3B8]">
                              {member.role === "ADMIN"
                                ? classroom?.type === "TEACHING" ? "Teacher" : "Admin"
                                : classroom?.type === "TEACHING" ? "Student" : "Member"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Chat;

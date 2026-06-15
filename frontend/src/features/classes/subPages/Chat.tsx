import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassroomById, getMembers } from "@/services/classroom-service";
import { getMessages, getChatSharedFiles, getChatSharedLinks, getChatReads, getChatPinned } from "@/services/chat-service";
import { getUsers } from "@/services/user-service";
import { uploadFile } from "@/services/file-service";
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
  Loader2,
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  X,
} from "lucide-react";
import FileAttachment from "@/shared/components/FileAttachment";
import MediaFilesPanel from "@/shared/components/MediaFilesPanel";
import { MessageReactions, ReactionPicker } from "@/shared/components/MessageReactions";
import { MentionInput, MentionText } from "@/shared/components/Mention";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { Classroom, ChatMessage, Member, UserSummary } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";
import { createConversation } from "@/services/dm-service";

const Chat = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(true);
  const [mediaView, setMediaView] = useState<null | "media" | "files" | "links">(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinned, setPinned] = useState<ChatMessage[]>([]);
  const [reads, setReads] = useState<Record<string, string>>({});
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

    getChatReads(classId).then((data) => {
      setReads(Object.fromEntries(data.map((r) => [r.userId, r.lastReadAt])));
    });

    getChatPinned(classId).then(setPinned);

    const socket = connectSocket();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", classId);
      // Mark read after join-room has registered the socket in the room
      setTimeout(() => socket.emit("mark-read", classId), 400);
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
        // We're viewing the room, so mark the incoming message as read
        if (msg.senderId !== user?.userId) socket.emit("mark-read", classId);
        setTimeout(scrollToBottom, 50);
      }
    });

    socket.on("read-update", ({ userId: readerId, lastReadAt }: { userId: string; lastReadAt: string }) => {
      setReads((prev) => ({ ...prev, [readerId]: lastReadAt }));
    });

    socket.on("message-pinned", (msg: ChatMessage) => {
      if (msg.classId !== classId) return;
      setPinned((prev) => [msg, ...prev.filter((m) => m.id !== msg.id)]);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, pinnedAt: msg.pinnedAt, pinnedBy: msg.pinnedBy } : m,
        ),
      );
    });

    socket.on("message-unpinned", (msg: ChatMessage) => {
      if (msg.classId !== classId) return;
      setPinned((prev) => prev.filter((m) => m.id !== msg.id));
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, pinnedAt: null, pinnedBy: null } : m)),
      );
    });

    socket.on("reaction-update", ({ messageId, reactions }: { classId: string; messageId: string; reactions: ChatMessage["reactions"] }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
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
      socket.off("read-update");
      socket.off("message-pinned");
      socket.off("message-unpinned");
      socket.off("reaction-update");
      socket.off("presence-update");
      socket.off("user-typing");
      socket.off("user-stop-typing");
      socket.off("connect");
      socket.off("disconnect");
      disconnectSocket();
    };
  }, [classId, classroom?.chatEnabled, scrollToBottom, user?.userId]);

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
    socket.emit("send-message", { classId, content: text, mentions: mentionIds });
    socket.emit("stop-typing", classId);
    setMessage("");
    setMentionIds([]);
  };

  const pinMessage = (messageId: string) => {
    if (!classId) return;
    connectSocket().emit("pin-message", { classId, messageId });
  };

  const unpinMessage = (messageId: string) => {
    if (!classId) return;
    connectSocket().emit("unpin-message", { classId, messageId });
  };

  const scrollToMessage = (messageId: string) => {
    document
      .getElementById(`msg-${messageId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const reactToMessage = (msg: ChatMessage, emoji: string) => {
    if (!classId) return;
    connectSocket().emit("react-message", { classId, messageId: msg.id, emoji });
  };

  const toggleReaction = (msg: ChatMessage, emoji: string) => {
    if (!classId) return;
    const mine = !!msg.reactions
      ?.find((r) => r.emoji === emoji)
      ?.userIds.includes(user?.userId ?? "");
    connectSocket().emit(mine ? "unreact-message" : "react-message", {
      classId,
      messageId: msg.id,
      emoji,
    });
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

  const handleDirectMessage = async (memberId: string) => {
    const conv = await createConversation(memberId);
    navigate(`/messages/${conv.id}`);
  };

  const onlineSet = new Set(onlineUserIds);

  const typingNames = [...typingUsers]
    .filter((id) => id !== user?.userId)
    .map((id) => userName(id).split(" ")[0]);

  const mentionMembers = memberList
    .filter((m) => m.userId !== user?.userId)
    .map((m) => ({ userId: m.userId, name: userName(m.userId) }))
    .filter((m) => m.name && m.name !== "Unknown");
  const memberNames = memberList
    .map((m) => userName(m.userId))
    .filter((n) => n && n !== "Unknown");

  const lastMessage = messages[messages.length - 1];
  const seenByIds = lastMessage
    ? Object.entries(reads)
        .filter(
          ([uid, ts]) =>
            uid !== user?.userId && new Date(ts) >= new Date(lastMessage.createdAt),
        )
        .map(([uid]) => uid)
    : [];

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

            {/* Pinned messages banner */}
            {pinned.length > 0 && (
              <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Pin className="w-3.5 h-3.5 text-[#137FEC]" />
                  <span className="text-[11px] font-semibold text-[#475569]">
                    Pinned ({pinned.length})
                  </span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {pinned.map((m) => (
                    <div key={m.id} className="group/pin flex items-center gap-2 text-xs">
                      <button
                        onClick={() => scrollToMessage(m.id)}
                        className="flex-1 min-w-0 text-left truncate text-[#64748B] hover:text-[#137FEC] cursor-pointer"
                      >
                        <span className="font-medium">{userName(m.senderId).split(" ")[0]}: </span>
                        {m.content ?? m.fileName ?? "Attachment"}
                      </button>
                      <button
                        onClick={() => unpinMessage(m.id)}
                        title="Unpin"
                        className="opacity-0 group-hover/pin:opacity-100 p-0.5 text-[#94A3B8] hover:text-red-500 cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages area */}
            <ScrollArea
              ref={scrollAreaRef}
              className="flex-1 overflow-hidden"
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
                      id={`msg-${msg.id}`}
                      className={`group relative flex gap-2.5 rounded-md px-1 -mx-1 ${
                        showAvatar ? "mt-3" : "mt-0.5"
                      } ${msg.pinnedAt ? "bg-amber-50" : ""}`}
                    >
                      <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ReactionPicker onPick={(e) => reactToMessage(msg, e)} />
                        <button
                          onClick={() => (msg.pinnedAt ? unpinMessage(msg.id) : pinMessage(msg.id))}
                          title={msg.pinnedAt ? "Unpin message" : "Pin message"}
                          className="p-1 rounded hover:bg-[#E2E8F0] text-[#94A3B8] cursor-pointer"
                        >
                          {msg.pinnedAt ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        </button>
                      </div>
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
                            {msg.pinnedAt && (
                              <Pin className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-sm text-[#334155] break-words">
                            <MentionText text={msg.content} names={memberNames} />
                          </p>
                        )}
                        {msg.fileKey && msg.fileName && (
                          <FileAttachment fileKey={msg.fileKey} fileName={msg.fileName} />
                        )}
                        <MessageReactions
                          reactions={msg.reactions}
                          myId={user?.userId}
                          onToggle={(e) => toggleReaction(msg, e)}
                        />
                      </div>
                    </div>
                  );
                })}

                {seenByIds.length > 0 && (
                  <div className="flex items-center justify-end gap-1.5 mt-1 pr-1">
                    <span className="text-[10px] text-[#94A3B8]">
                      Seen by {seenByIds.length}
                    </span>
                    <div className="flex -space-x-1.5">
                      {seenByIds.slice(0, 5).map((id) => (
                        <Avatar key={id} className="w-4 h-4 ring-1 ring-white" title={userName(id)}>
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-[7px] font-semibold">
                            {userInitials(id)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                )}
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
                <MentionInput
                  value={message}
                  onChange={setMessage}
                  members={mentionMembers}
                  onMentionsChange={setMentionIds}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${classroom?.name}...`}
                  className="w-full text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none bg-transparent"
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
              {mediaView ? (
                classId && (
                  <MediaFilesPanel
                    filesQueryKey={["chat-shared-files", classId]}
                    filesQueryFn={() => getChatSharedFiles(classId)}
                    linksQueryKey={["chat-shared-links", classId]}
                    linksQueryFn={() => getChatSharedLinks(classId)}
                    onViewChange={setMediaView}
                    initialView={mediaView}
                  />
                )
              ) : (
                <>
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
                          const isSelf = member.userId === user?.userId;
                          return (
                            <div
                              key={member.id}
                              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#F1F5F9]"
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
                                  {isSelf ? "You" : userName(member.userId)}
                                </p>
                                <p className="text-[10px] text-[#94A3B8]">
                                  {member.role === "ADMIN"
                                    ? classroom?.type === "TEACHING" ? "Teacher" : "Admin"
                                    : classroom?.type === "TEACHING" ? "Student" : "Member"}
                                </p>
                              </div>
                              {!isSelf && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#E2E8F0] cursor-pointer">
                                      <MoreVertical className="w-3.5 h-3.5 text-[#64748B]" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="min-w-[140px]">
                                    <DropdownMenuItem
                                      onClick={() => handleDirectMessage(member.userId)}
                                      className="text-xs cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 mr-2" />
                                      Direct message
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>

                  {classId && (
                    <MediaFilesPanel
                      filesQueryKey={["chat-shared-files", classId]}
                      filesQueryFn={() => getChatSharedFiles(classId)}
                      linksQueryKey={["chat-shared-links", classId]}
                      linksQueryFn={() => getChatSharedLinks(classId)}
                      onViewChange={setMediaView}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Chat;

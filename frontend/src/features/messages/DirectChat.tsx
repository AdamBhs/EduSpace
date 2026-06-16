import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDmMessages, getDmSharedFiles, getDmSharedLinks, getDmReads, getDmPinned, getConversation } from "@/services/dm-service";
import { getUsers } from "@/services/user-service";
import { uploadFile } from "@/services/file-service";
import { connectSocket, disconnectSocket } from "@/services/websocket";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Paperclip,
  Send,
  Loader2,
  Info,
  Pin,
  PinOff,
  X,
} from "lucide-react";
import FileAttachment from "@/shared/components/FileAttachment";
import Linkify from "@/shared/components/Linkify";
import MediaFilesPanel from "@/shared/components/MediaFilesPanel";
import { MessageReactions, ReactionPicker } from "@/shared/components/MessageReactions";
import type { DirectMessage, UserSummary } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";

const DirectChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [pinned, setPinned] = useState<DirectMessage[]>([]);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [mediaView, setMediaView] = useState<null | "media" | "files" | "links">(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve the other participant from the conversation itself, so the name/avatar
  // show even when the loaded message window only contains my own messages.
  const { data: conversation } = useQuery({
    queryKey: ["dm-conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });
  const otherUserId = conversation?.otherUserId ?? null;

  const { data: otherUser } = useQuery<UserSummary>({
    queryKey: ["users", "dm-other", otherUserId],
    queryFn: async () => {
      const users = await getUsers([otherUserId!]);
      return users[0];
    },
    enabled: !!otherUserId,
  });

  const scrollToBottom = useCallback(() => {
    // Scroll the messages viewport directly (scrollIntoView would bubble up and
    // scroll the page container when messages don't overflow).
    const vp = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null;
    if (vp) vp.scrollTop = vp.scrollHeight;
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    getDmMessages(conversationId).then((data) => {
      setMessages(data.messages);
      setNextCursor(data.nextCursor);

      setTimeout(() => {
        scrollToBottom();
      }, 50);
    });

    getDmReads(conversationId).then((data) => {
      const other = data.find((r) => r.userId !== user?.userId);
      if (other) setOtherReadAt(other.lastReadAt);
    });

    getDmPinned(conversationId).then(setPinned);

    // Opening the conversation marks it read — refresh unread badges (list + sidebar total)
    const unreadRefresh = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["dm-unread-total"] });
    }, 1200);

    const socket = connectSocket();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-dm", conversationId);
      socket.emit("mark-dm-read", conversationId);
    });

    if (socket.connected) {
      setConnected(true);
      socket.emit("join-dm", conversationId);
      socket.emit("mark-dm-read", conversationId);
    }

    socket.on("disconnect", () => setConnected(false));

    socket.on("new-dm", (msg: DirectMessage) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [...prev, msg]);
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(msg.senderId);
          return next;
        });

        // We're viewing the conversation, so mark the incoming message as read
        if (msg.senderId !== user?.userId) socket.emit("mark-dm-read", conversationId);

        setTimeout(scrollToBottom, 50);
      }
    });

    socket.on("dm-read-update", ({ userId: readerId, lastReadAt }: { userId: string; lastReadAt: string }) => {
      if (readerId !== user?.userId) setOtherReadAt(lastReadAt);
    });

    socket.on("dm-pinned", (msg: DirectMessage) => {
      if (msg.conversationId !== conversationId) return;
      setPinned((prev) => [msg, ...prev.filter((m) => m.id !== msg.id)]);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, pinnedAt: msg.pinnedAt, pinnedBy: msg.pinnedBy } : m,
        ),
      );
    });

    socket.on("dm-unpinned", (msg: DirectMessage) => {
      if (msg.conversationId !== conversationId) return;
      setPinned((prev) => prev.filter((m) => m.id !== msg.id));
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, pinnedAt: null, pinnedBy: null } : m)),
      );
    });

    socket.on("dm-reaction-update", ({ messageId, reactions }: { conversationId: string; messageId: string; reactions: DirectMessage["reactions"] }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    });

    socket.on("dm-user-typing", ({ userId: typerId }: { userId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(typerId));
    });

    socket.on("dm-user-stop-typing", ({ userId: typerId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(typerId);
        return next;
      });
    });

    return () => {
      clearTimeout(unreadRefresh);
      socket.emit("leave-dm", conversationId);
      socket.off("new-dm");
      socket.off("dm-read-update");
      socket.off("dm-pinned");
      socket.off("dm-unpinned");
      socket.off("dm-reaction-update");
      socket.off("dm-user-typing");
      socket.off("dm-user-stop-typing");
      socket.off("connect");
      socket.off("disconnect");
      disconnectSocket();
    };
  }, [conversationId, scrollToBottom, user?.userId]);

  const loadOlderMessages = async () => {
    if (!nextCursor || loadingMore || !conversationId) return;
    setLoadingMore(true);

    const scrollEl = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
    const prevHeight = scrollEl?.scrollHeight ?? 0;

    const data = await getDmMessages(conversationId, nextCursor);
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
    if (!text || !conversationId) return;

    const socket = connectSocket();
    socket.emit("send-dm", { conversationId, content: text });
    socket.emit("dm-stop-typing", conversationId);
    setMessage("");
  };

  const pinMessage = (messageId: string) => {
    if (!conversationId) return;
    connectSocket().emit("pin-dm", { conversationId, messageId });
  };

  const unpinMessage = (messageId: string) => {
    if (!conversationId) return;
    connectSocket().emit("unpin-dm", { conversationId, messageId });
  };

  const scrollToMessage = (messageId: string) => {
    document
      .getElementById(`dm-${messageId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const reactToMessage = (msg: DirectMessage, emoji: string) => {
    if (!conversationId) return;
    connectSocket().emit("react-dm", { conversationId, messageId: msg.id, emoji });
  };

  const toggleReaction = (msg: DirectMessage, emoji: string) => {
    if (!conversationId) return;
    const mine = !!msg.reactions
      ?.find((r) => r.emoji === emoji)
      ?.userIds.includes(user?.userId ?? "");
    connectSocket().emit(mine ? "unreact-dm" : "react-dm", {
      conversationId,
      messageId: msg.id,
      emoji,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    e.target.value = "";

    try {
      const uploaded = await uploadFile(file);
      const socket = connectSocket();
      socket.emit("send-dm", {
        conversationId,
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
    if (conversationId) {
      const socket = connectSocket();
      socket.emit("dm-typing", conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("dm-stop-typing", conversationId);
      }, 2000);
    }
  };

  const otherName = otherUser
    ? `${otherUser.userName ?? ""} ${otherUser.userLastName ?? ""}`.trim() || "Unknown"
    : "Loading...";

  const otherInitials = otherUser
    ? `${otherUser.userName?.[0] ?? ""}${otherUser.userLastName?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  const myInitials = user?.profile
    ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  const typingNames = [...typingUsers]
    .filter((id) => id !== user?.userId)
    .map(() => otherName.split(" ")[0]);

  const lastMessage = messages[messages.length - 1];
  const dmSeen =
    !!lastMessage &&
    lastMessage.senderId === user?.userId &&
    !!otherReadAt &&
    new Date(otherReadAt) >= new Date(lastMessage.createdAt);

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
        <Avatar className="w-9 h-9">
          <AvatarImage src={otherUser?.avatarUrl ?? undefined} alt="" className="object-cover" />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
            {otherInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-[#0F172A] leading-tight">{otherName}</h2>
          <p className="text-[11px] text-[#94A3B8]">
            {connected ? "Online" : "Connecting..."}
          </p>
        </div>
        <button
          onClick={() => setShowInfo((p) => !p)}
          className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
            showInfo
              ? "bg-[#137FEC]/10 text-[#137FEC]"
              : "hover:bg-[#F1F5F9] text-[#94A3B8]"
          }`}
          title="Conversation info"
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
                  <span className="font-medium">
                    {(m.senderId === user?.userId ? "You" : otherName).split(" ")[0]}:{" "}
                  </span>
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

      {/* Messages */}
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
              No messages yet. Say hello!
            </p>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.senderId === user?.userId;
            const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                id={`dm-${msg.id}`}
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
                      <AvatarImage src={(isMe ? user?.profile?.avatarUrl : otherUser?.avatarUrl) ?? undefined} alt="" className="object-cover" />
                      <AvatarFallback
                        className={`text-[10px] font-semibold ${
                          isMe
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {isMe ? myInitials : otherInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {isMe ? "You" : otherName}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.pinnedAt && <Pin className="w-3 h-3 text-amber-500" />}
                    </div>
                  )}
                  {msg.content && (
                    <p className="text-sm text-[#334155] break-words"><Linkify text={msg.content} /></p>
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

          {dmSeen && (
            <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
              <Avatar className="w-3.5 h-3.5" title={`Seen by ${otherName}`}>
                <AvatarFallback className="bg-gray-200 text-gray-600 text-[6px] font-semibold">
                  {otherInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-[#94A3B8]">Seen</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="px-5 py-1.5 flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <span>{typingNames[0]} is typing</span>
          <span className="flex items-end gap-[3px] h-4">
            <span className="w-1 h-1 rounded-full bg-[#94A3B8]" style={{ animation: "typing-dot 1.2s infinite 0ms" }} />
            <span className="w-1 h-1 rounded-full bg-[#94A3B8]" style={{ animation: "typing-dot 1.2s infinite 200ms" }} />
            <span className="w-1 h-1 rounded-full bg-[#94A3B8]" style={{ animation: "typing-dot 1.2s infinite 400ms" }} />
          </span>
        </div>
      )}

      {/* Input */}
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
            placeholder={`Message ${otherName}...`}
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

      {showInfo && conversationId && (
        <div className="w-56 border-l border-[#E2E8F0] flex flex-col bg-white shrink-0 h-full">
          {mediaView ? (
            <MediaFilesPanel
              filesQueryKey={["dm-shared-files", conversationId]}
              filesQueryFn={() => getDmSharedFiles(conversationId)}
              linksQueryKey={["dm-shared-links", conversationId]}
              linksQueryFn={() => getDmSharedLinks(conversationId)}
              onViewChange={setMediaView}
              initialView={mediaView}
            />
          ) : (
            <>
              <div className="flex flex-col items-center py-5 px-3 border-b border-[#E2E8F0]">
                <Avatar className="w-14 h-14 mb-2">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                    {otherInitials}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-bold text-[#0F172A]">{otherName}</p>
                <p className="text-[11px] text-[#94A3B8]">
                  {connected ? "Online" : "Offline"}
                </p>
              </div>
              <ScrollArea className="flex-1 overflow-hidden">
                <MediaFilesPanel
                  filesQueryKey={["dm-shared-files", conversationId]}
                  filesQueryFn={() => getDmSharedFiles(conversationId)}
                  linksQueryKey={["dm-shared-links", conversationId]}
                  linksQueryFn={() => getDmSharedLinks(conversationId)}
                  onViewChange={setMediaView}
                />
              </ScrollArea>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectChat;

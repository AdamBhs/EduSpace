import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDmMessages, getDmSharedFiles, getDmSharedLinks } from "@/services/dm-service";
import { getUsers } from "@/services/user-service";
import { uploadFile } from "@/services/file-service";
import { connectSocket, disconnectSocket } from "@/services/websocket";
import {
  Avatar,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Paperclip,
  Send,
  Loader2,
  Info,
} from "lucide-react";
import FileAttachment from "@/shared/components/FileAttachment";
import Linkify from "@/shared/components/Linkify";
import MediaFilesPanel from "@/shared/components/MediaFilesPanel";
import type { DirectMessage, UserSummary } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";

const DirectChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [mediaView, setMediaView] = useState<null | "media" | "files" | "links">(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: otherUser } = useQuery<UserSummary>({
    queryKey: ["users", "dm-other", otherUserId],
    queryFn: async () => {
      const users = await getUsers([otherUserId!]);
      return users[0];
    },
    enabled: !!otherUserId,
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    getDmMessages(conversationId).then((data) => {
      setMessages(data.messages);
      setNextCursor(data.nextCursor);

      if (data.messages.length > 0) {
        const firstOther = data.messages.find((m) => m.senderId !== user?.userId);
        if (firstOther) setOtherUserId(firstOther.senderId);
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 50);
    });

    const socket = connectSocket();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-dm", conversationId);
    });

    if (socket.connected) {
      setConnected(true);
      socket.emit("join-dm", conversationId);
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

        if (!otherUserId && msg.senderId !== user?.userId) {
          setOtherUserId(msg.senderId);
        }

        setTimeout(scrollToBottom, 50);
      }
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
      socket.emit("leave-dm", conversationId);
      socket.off("new-dm");
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

    const scrollEl = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
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

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
        <Avatar className="w-9 h-9">
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
                    </div>
                  )}
                  {msg.content && (
                    <p className="text-sm text-[#334155] break-words"><Linkify text={msg.content} /></p>
                  )}
                  {msg.fileKey && msg.fileName && (
                    <FileAttachment fileKey={msg.fileKey} fileName={msg.fileName} />
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

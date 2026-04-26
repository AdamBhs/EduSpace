import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassroomById } from "@/services/classroom-service";
import NavLinksClass from "../components/NavLinksClass";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Hash,
  Plus,
  Info,
  Bold,
  Italic,
  Link2,
  List,
  Code,
  Smile,
  Paperclip,
  Send,
  ChevronDown,
  X,
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────

type Channel = { id: string; name: string; unread?: number };
type DirectMessage = {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  initialsColor?: string;
};
type Member = {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  initialsColor?: string;
  status: string;
  online: boolean;
};
type ChatMessage = {
  id: string;
  author: string;
  avatar?: string;
  initials: string;
  initialsColor?: string;
  content: string;
  time: string;
  date: string;
  isOwn: boolean;
};

const CHANNELS: Channel[] = [
  { id: "general", name: "general" },
  { id: "study-group-1", name: "study-group-1" },
  { id: "lab-reports", name: "lab-reports", unread: 3 },
  { id: "exam-prep", name: "exam-prep" },
];

const DIRECT_MESSAGES: DirectMessage[] = [
  { id: "dm-1", name: "Dr. Sarah Jenkins", avatar: "/avatars/sarah.jpg", initials: "SJ" },
  { id: "dm-2", name: "Alex Thompson", avatar: "/avatars/alex.jpg", initials: "AT" },
  { id: "dm-3", name: "Maria Santos", initials: "MS", initialsColor: "bg-emerald-500" },
];

const MEMBERS: Member[] = [
  { id: "1", name: "Dr. Sarah Jenkins", avatar: "/avatars/sarah.jpg", initials: "SJ", status: "Teaching...", online: true },
  { id: "2", name: "Alex Thompson", avatar: "/avatars/alex.jpg", initials: "AT", status: "Studying unit 2", online: true },
  { id: "3", name: "Jason Smith", initials: "JS", initialsColor: "bg-blue-500", status: "", online: true },
  { id: "4", name: "You", initials: "ME", initialsColor: "bg-[#137FEC]", status: "Active", online: true },
  { id: "5", name: "Emma Wilson", initials: "EW", status: "", online: false },
  { id: "6", name: "Ryan Kim", initials: "RK", status: "", online: false },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    author: "Dr. Sarah Jenkins",
    avatar: "/avatars/sarah.jpg",
    initials: "SJ",
    content:
      "Welcome everyone! I've just published the Unit 2 resources in the Classwork tab. Please remember to check them before Thursday's lecture on DNA replication.",
    time: "10:15 AM",
    date: "MONDAY, OCT 24",
    isOwn: false,
  },
  {
    id: "2",
    author: "Me",
    initials: "ME",
    initialsColor: "bg-[#137FEC]",
    content:
      "Thanks Dr. Jenkins! Should we bring our printed lab manuals for the afternoon session tomorrow?",
    time: "10:42 AM",
    date: "MONDAY, OCT 24",
    isOwn: true,
  },
  {
    id: "3",
    author: "Alex Thompson",
    avatar: "/avatars/alex.jpg",
    initials: "AT",
    content:
      "I have the same question! Also, is there a PDF version of the manual available for those using tablets?",
    time: "10:45 AM",
    date: "MONDAY, OCT 24",
    isOwn: false,
  },
];

// ─── Sub-components ──────────────────────────────────────────

/** Left sidebar — Channels & DMs */
const ChannelsSidebar = ({
  activeChannel,
  onSelectChannel,
}: {
  activeChannel: string;
  onSelectChannel: (id: string) => void;
}) => (
  <div className="flex flex-col h-full w-60 border-r border-[#E2E8F0] bg-white">
    <ScrollArea className="flex-1 overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        {/* Channels */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
            Channels
          </span>
          <button className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#F1F5F9] cursor-pointer">
            <Plus className="w-3.5 h-3.5 text-[#94A3B8]" />
          </button>
        </div>
        <ul className="space-y-0.5">
          {CHANNELS.map((ch) => {
            const isActive = activeChannel === ch.id;
            return (
              <li
                key={ch.id}
                onClick={() => onSelectChannel(ch.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer select-none ${
                  isActive
                    ? "bg-[#137FEC] text-white"
                    : "text-[#334155] hover:bg-[#F1F5F9]"
                }`}
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1">{ch.name}</span>
                {ch.unread && (
                  <span
                    className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${
                      isActive
                        ? "bg-white text-[#137FEC]"
                        : "bg-[#137FEC] text-white"
                    }`}
                  >
                    {ch.unread}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* Direct Messages */}
        <div className="flex items-center justify-between mt-6 mb-2">
          <span className="text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
            Direct Messages
          </span>
          <button className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#F1F5F9] cursor-pointer">
            <Plus className="w-3.5 h-3.5 text-[#94A3B8]" />
          </button>
        </div>
        <ul className="space-y-0.5">
          {DIRECT_MESSAGES.map((dm) => (
            <li
              key={dm.id}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-[#334155] hover:bg-[#F1F5F9] cursor-pointer select-none"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={dm.avatar} />
                <AvatarFallback
                  className={`text-[10px] text-white ${
                    dm.initialsColor || "bg-[#94A3B8]"
                  }`}
                >
                  {dm.initials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{dm.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </ScrollArea>
  </div>
);

/** Right sidebar — Members & Files tabs */
const MembersSidebar = () => {
  const [activeTab, setActiveTab] = useState<"members" | "files">("members");
  const onlineMembers = MEMBERS.filter((m) => m.online);
  const offlineMembers = MEMBERS.filter((m) => !m.online);

  return (
    <div className="flex flex-col h-full w-56 border-l border-[#E2E8F0] bg-white">
      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-1 py-2.5 text-xs font-semibold tracking-wide cursor-pointer ${
            activeTab === "members"
              ? "text-[#137FEC] border-b-2 border-[#137FEC]"
              : "text-[#94A3B8] hover:text-[#64748B]"
          }`}
        >
          MEMBERS
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 py-2.5 text-xs font-semibold tracking-wide cursor-pointer ${
            activeTab === "files"
              ? "text-[#137FEC] border-b-2 border-[#137FEC]"
              : "text-[#94A3B8] hover:text-[#64748B]"
          }`}
        >
          FILES
        </button>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        {activeTab === "members" ? (
          <div className="px-4 pt-4">
            {/* Online */}
            <p className="text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase mb-2">
              Online — {onlineMembers.length}
            </p>
            <ul className="space-y-3">
              {onlineMembers.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={m.avatar} />
                      <AvatarFallback
                        className={`text-[11px] text-white ${
                          m.initialsColor || "bg-[#94A3B8]"
                        }`}
                      >
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {m.name}
                    </p>
                    {m.status && (
                      <p className="text-[11px] text-[#137FEC] truncate">
                        {m.status}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Offline */}
            <p className="text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase mt-6 mb-2">
              Offline — {offlineMembers.length}
            </p>
            <ul className="space-y-3">
              {offlineMembers.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 opacity-60">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback
                      className={`text-[11px] text-white ${
                        m.initialsColor || "bg-[#94A3B8]"
                      }`}
                    >
                      {m.initials}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-[#0F172A] truncate">{m.name}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="px-4 pt-4">
            <p className="text-sm text-[#94A3B8] text-center mt-10">
              No files shared yet
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

/** Date separator */
const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex items-center gap-4 my-5">
    <div className="flex-1 h-px bg-[#E2E8F0]" />
    <span className="text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase whitespace-nowrap">
      {date}
    </span>
    <div className="flex-1 h-px bg-[#E2E8F0]" />
  </div>
);

/** Single chat message */
const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  if (msg.isOwn) {
    return (
      <div className="flex items-end justify-end gap-2 mb-4">
        <div className="flex flex-col items-end max-w-[65%]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-[#94A3B8]">{msg.time}</span>
            <span className="text-xs font-semibold text-[#0F172A]">Me</span>
          </div>
          <div className="bg-[#137FEC] text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm leading-relaxed">
            {msg.content}
          </div>
        </div>
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={msg.avatar} />
          <AvatarFallback
            className={`text-[10px] text-white ${
              msg.initialsColor || "bg-[#94A3B8]"
            }`}
          >
            {msg.initials}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 mb-4 max-w-[65%]">
      <Avatar className="w-8 h-8 shrink-0 mt-1">
        <AvatarImage src={msg.avatar} />
        <AvatarFallback
          className={`text-[10px] text-white ${
            msg.initialsColor || "bg-[#94A3B8]"
          }`}
        >
          {msg.initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-[#137FEC]">
            {msg.author}
          </span>
          <span className="text-[11px] text-[#94A3B8]">{msg.time}</span>
        </div>
        <div className="bg-[#F1F5F9] text-[#0F172A] text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    </div>
  );
};

/** Message input bar */
const MessageInput = ({ channelName }: { channelName: string }) => {
  const [message, setMessage] = useState("");

  return (
    <div className="border-t border-[#E2E8F0] bg-white px-4 py-3">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 mb-2">
        <button className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer">
          <Bold className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer">
          <Italic className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer">
          <Link2 className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer">
          <List className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] cursor-pointer">
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <button className="p-1.5 rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] cursor-pointer">
          <Plus className="w-5 h-5" />
        </button>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message #${channelName}`}
          className="flex-1 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none bg-transparent"
        />
        <button className="p-1.5 rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] cursor-pointer">
          <Paperclip className="w-4.5 h-4.5" />
        </button>
        <button className="p-1.5 rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] cursor-pointer">
          <Smile className="w-4.5 h-4.5" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#137FEC] hover:bg-[#1171d4] text-white cursor-pointer">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Chat Page ──────────────────────────────────────────

const Chat = () => {
  const { classId } = useParams<{ classId: string }>();
  const user = JSON.parse(localStorage.getItem("user")!);
  const [activeChannel, setActiveChannel] = useState("general");
  const [showChannels, setShowChannels] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: classroom,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (isLoading) return <div className="p-6 text-sm text-[#64748B]">Loading...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error loading classroom</div>;

  const isTeacher = user?.userId === classroom?.teacher_id;
  const activeChannelData = CHANNELS.find((c) => c.id === activeChannel);

  // Group messages by date for separators
  const renderedDates = new Set<string>();

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="px-6">
          <NavLinksClass
            isTeacher={isTeacher}
            classId={classId!}
            activeTab="Chat"
          />
        </div>

        <div className="flex flex-1 min-h-0">
          {/* ── Left: Channels Sidebar (toggleable) ── */}
          {showChannels && (
            <ChannelsSidebar
              activeChannel={activeChannel}
              onSelectChannel={setActiveChannel}
            />
          )}

          {/* ── Center: Chat Area ── */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                {/* # toggle button for channels sidebar */}
                <button
                  onClick={() => setShowChannels((p) => !p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-colors ${
                    showChannels
                      ? "bg-[#137FEC]/10 text-[#137FEC]"
                      : "hover:bg-[#F1F5F9] text-[#94A3B8]"
                  }`}
                  title="Toggle channels"
                >
                  <Hash className="w-4.5 h-4.5" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A] leading-tight">
                    {activeChannelData?.name || "general"}
                  </h2>
                  <p className="text-[11px] text-[#94A3B8]">
                    General discussion for Advanced Biology students
                  </p>
                </div>
              </div>

              {/* Info toggle button for members sidebar */}
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
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                {MOCK_MESSAGES.map((msg) => {
                  const showDate = !renderedDates.has(msg.date);
                  if (showDate) renderedDates.add(msg.date);
                  return (
                    <div key={msg.id}>
                      {showDate && <DateSeparator date={msg.date} />}
                      <MessageBubble msg={msg} />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <MessageInput channelName={activeChannelData?.name || "general"} />
          </div>

          {/* ── Right: Members Sidebar (toggleable) ── */}
          {showMembers && <MembersSidebar />}
        </div>
      </section>
    </div>
  );
};

export default Chat;

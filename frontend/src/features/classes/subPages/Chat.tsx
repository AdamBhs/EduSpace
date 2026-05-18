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
  Info,
  Smile,
  Paperclip,
  Send,
} from "lucide-react";
import type { Classroom } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";

const Chat = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: classroom,
    isLoading,
    error,
  } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (isLoading) return <div className="p-6 text-sm text-[#64748B]">Loading...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error loading classroom</div>;

  if (!classroom?.chatEnabled) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Chat is disabled for this classroom
      </div>
    );
  }

  const userInitials = user?.profile
    ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

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
                    Group chat &middot; {classroom?._count?.members ?? 0} members
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
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-5 py-4 flex items-center justify-center h-full">
                <p className="text-sm text-[#94A3B8]">
                  Chat will be connected via WebSocket. Messages will appear here.
                </p>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="border-t border-[#E2E8F0] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Message ${classroom?.name}...`}
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
          </div>

          {/* Members sidebar */}
          {showMembers && (
            <div className="flex flex-col h-full w-56 border-l border-[#E2E8F0] bg-white">
              <div className="flex border-b border-[#E2E8F0]">
                <div className="flex-1 py-2.5 text-xs font-semibold tracking-wide text-[#137FEC] border-b-2 border-[#137FEC] text-center">
                  MEMBERS
                </div>
              </div>
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="px-4 pt-4">
                  <p className="text-sm text-[#94A3B8] text-center mt-10">
                    Member list will load from API
                  </p>
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

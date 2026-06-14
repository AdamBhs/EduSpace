import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { getChatUnread } from "@/services/chat-service";
import type { ClassroomType, Role } from "@/shared/types";

const NavLinksClass = ({
  classId,
  activeTab,
  classroomType,
  userRole,
  chatEnabled,
}: {
  classId: string;
  activeTab: string;
  classroomType: ClassroomType;
  userRole: Role;
  chatEnabled: boolean;
}) => {
  const navigate = useNavigate();
  const [, setSelectTab] = useState(activeTab);

  const isTeaching = classroomType === "TEACHING";
  const isAdmin = userRole === "ADMIN";

  const tabs: string[] = ["Stream", "Classwork", "People"];

  if (chatEnabled) tabs.push("Chat");
  if (isTeaching && isAdmin) tabs.push("Grades");

  // Unread badge for the Chat tab (skip while the chat is open — it's being read)
  const { data: chatUnread } = useQuery({
    queryKey: ["chat-unread", classId],
    queryFn: () => getChatUnread(classId),
    enabled: chatEnabled && activeTab !== "Chat",
    refetchInterval: 30000,
  });
  const chatUnreadCount = activeTab === "Chat" ? 0 : chatUnread?.count ?? 0;

  const handleNavSections = (tab: string) => {
    setSelectTab(tab);

    switch (tab) {
      case "Stream":
        navigate(`/c/${classId}`);
        break;
      case "Classwork":
        navigate(`/c/${classId}/materials`);
        break;
      case "People":
        navigate(`/c/${classId}/people`);
        break;
      case "Chat":
        navigate(`/c/${classId}/chat`);
        break;
      case "Grades":
        navigate(`/c/${classId}/grades`);
        break;
    }
  };

  return (
    <header className="-mx-6 border-b border-[#E2E8F0] px-8 flex items-center justify-between">
      <ul className="flex text-sm text-[#64748B] w-max gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <li
              key={tab}
              onClick={() => handleNavSections(tab)}
              className={`flex items-center gap-1.5 cursor-pointer select-none transition delay-20 px-5 py-3 border-b-2 ${
                isActive
                  ? "text-[#137FEC] border-[#137FEC]"
                  : "border-transparent hover:text-[#137FEC]/80 hover:border-[#137FEC]/60"
              }`}
            >
              {tab}
              {tab === "Chat" && chatUnreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full bg-[#137FEC] text-white text-[10px] font-semibold">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {isAdmin && (
        <button
          onClick={() => navigate(`/c/${classId}/settings`)}
          className="p-2 rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer"
          title="Classroom Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      )}
    </header>
  );
};

export default NavLinksClass;

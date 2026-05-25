import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
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
  const [selectTab, setSelectTab] = useState(activeTab);

  const isTeaching = classroomType === "TEACHING";
  const isAdmin = userRole === "ADMIN";

  const tabs: string[] = ["Stream", "Materials", "People"];

  if (isTeaching) tabs.push("Assignments");
  if (chatEnabled) tabs.push("Chat");
  if (isTeaching && isAdmin) tabs.push("Grades");

  const handleNavSections = (tab: string) => {
    setSelectTab(tab);

    switch (tab) {
      case "Stream":
        navigate(`/c/${classId}`);
        break;
      case "Materials":
        navigate(`/c/${classId}/materials`);
        break;
      case "People":
        navigate(`/c/${classId}/people`);
        break;
      case "Assignments":
        navigate(`/c/${classId}/assignments`);
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
              className={`cursor-pointer select-none transition delay-20 px-5 py-3 border-b-2 ${
                isActive
                  ? "text-[#137FEC] border-[#137FEC]"
                  : "border-transparent hover:text-[#137FEC]/80 hover:border-[#137FEC]/60"
              }`}
            >
              {tab}
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

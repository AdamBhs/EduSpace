import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NavLinksClass = ({
  isTeacher,
  classId,
  activeTab,
}: {
  isTeacher: boolean;
  classId: string;
  activeTab: string;
}) => {
  const navigate = useNavigate();
  const [selectTab, setSelectTab] = useState(activeTab);

  let tabs;
  if (isTeacher) {
    tabs = [
      "Classwork",
      "Work and homework",
      "Stream",
      "People",
      "Chat",
      "Notes",
    ];
  } else {
    tabs = ["Classwork", "Work and homework", "Stream", "People", "Chat"];
  }

  const peoplePath = classId ? `/c/${classId}/people` : "";
  const classWorkPath = classId ? `/c/${classId}` : "";

  //   const handleNavSections = (tab: any) => {
  //     if (selectTab === "People" && peoplePath) {
  //       navigate(peoplePath);
  //       return;
  //     }
  //   };
  const handleNavSections = (tab: string) => {
    setSelectTab(tab);

    switch (tab) {
      case "People":
        navigate(`/c/${classId}/people`);
        break;
      case "Classwork":
        navigate(`/c/${classId}`);
        break;
      case "Stream":
        navigate(`/c/${classId}/stream`);
        break;
      case "Work and homework":
        navigate(`/c/${classId}/work`);
        break;
      case "Chat":
        navigate(`/c/${classId}/chat`);
        break;
      case "Notes":
        navigate(`/c/${classId}/notes`);
        break;
      default:
        break;
    }
  };

  return (
    <header className="-mx-6 border-b border-[#E2E8F0] px-6">
      <ul className="flex text-sm text-[#64748B] w-max gap-1">
        {tabs.map((tab: string, index: any) => {
          const isActive = activeTab === tab;
          return (
            <li
              key={index}
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
    </header>
  );
};

export default NavLinksClass;

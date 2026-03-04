import React, { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { useLocation, useNavigate, useParams } from "react-router-dom";
const Class = () => {
  const [activeTab, setActiveTab] = useState("Classwork");
  const navigate = useNavigate();
  const { classCode } = useParams();
  const location = useLocation();

  const tabs = ["Classwork", "Stream", "People", "Chat", "Notes"];
  const peoplePath = classCode ? `/c/${classCode}/people` : "";
  const handleNavSections = (tab: any) => {
    if (tab === "People" && peoplePath) {
      navigate(peoplePath, { state: location.state });
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <aside className="w-60 self-stretch border-r border-[#E2E8F0] px-6 py-5">
        <div className="text-sm font-semibold rounded-lg cursor-pointer hover:opacity-90 shadow-md text-white bg-[#137FEC] py-3 px-5 flex gap-1 items-center justify-center">
          <IoMdAdd size={18} /> Create Work
        </div>
        <h2 className="mt-6 text-[#94A3B8] text-[14px]">Filters</h2>
        <ul className="mt-6 space-y-2 text-sm text-slate-600">
          <li>Overview</li>
          <li>Announcements</li>
          <li>Assignments</li>
          <li>Resources</li>
        </ul>
      </aside>
      <section className="flex min-h-0 flex-1 flex-col px-6 ">
        <header className="-mx-6 border-b border-[#E2E8F0] px-6">
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
        </header>
        <div className="flex-1 overflow-y-auto py-2 text-sm text-slate-600"></div>
      </section>
    </div>
  );
};

export default Class;

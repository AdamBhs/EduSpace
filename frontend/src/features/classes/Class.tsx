import React, { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IoIosInfinite } from "react-icons/io";
import { FaFolder } from "react-icons/fa";
import { Input } from "@/shared/components/ui/input";
import { IoIosSearch } from "react-icons/io";

const Class = () => {
  const [activeTab, setActiveTab] = useState("Classwork");
  const [activeUnit, setActiveUnit] = useState("All Topics");

  const navigate = useNavigate();
  const { classCode } = useParams();
  const location = useLocation();

  const tabs = ["Classwork", "Stream", "People", "Chat", "Notes"];
  // TODO: This will change based on the Units on that specifique class class
  const units = ["All Topics", "Unit 1", "Unit 2"];

  const peoplePath = classCode ? `/c/${classCode}/people` : "";
  const handleNavSections = (tab: any) => {
    if (tab === "People" && peoplePath) {
      navigate(peoplePath, { state: location.state });
      return;
    }
    setActiveTab(tab);
  };

  const handleFilterByUnit = (unit: any) => {
    setActiveUnit(unit);
  };
  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <aside className="w-60 self-stretch border-r border-[#E2E8F0] px-6 py-5">
        <div
          className="text-sm font-semibold rounded-lg cursor-pointer hover:opacity-90 text-white bg-[#137FEC] py-3 px-5 flex gap-1 items-center justify-center"
          style={{ boxShadow: "0 2px 10px rgba(19, 127, 236, 0.5)" }}
        >
          <IoMdAdd size={18} /> Create Work
        </div>
        <h2 className="mt-6 text-[#94A3B8] text-[10px]">FILTERS</h2>
        <ul className="mt-4 space-y-1 text-sm text-slate-600">
          {units.map((unit, index) => {
            const isActiveUnit = activeUnit === unit;
            return (
              <li
                key={unit}
                onClick={() => handleFilterByUnit(unit)}
                className={`flex gap-2 items-center select-none cursor-pointer hover:bg-[#137FEC]/10 px-2 py-1.5 rounded-md ${
                  isActiveUnit
                    ? "text-[#137FEC] bg-[#137FEC]/10"
                    : "hover:text-[#137FEC]/80"
                }`}
              >
                {index === 0 ? <IoIosInfinite size={16} /> : <FaFolder />}
                {unit}
              </li>
            );
          })}
        </ul>
      </aside>
      <section className="flex min-h-0 flex-1 flex-col pl-6 ">
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
        <div className="flex-1 overflow-y-auto py-2  text-sm text-slate-600 pr-6">
          <div
            className="flex items-center max-w-60 border-gray-200 border rounded-md pl-2 mt-4 ml-0.5"
            style={{ boxShadow: "0 0px 2px rgba(211, 211, 211, 5)" }}
          >
            <IoIosSearch size={22} className="cursor-pointer" />
            <Input
              className="border-none shadow-none"
              type="text"
              placeholder="Search..."
            />
          </div>

          <div className="flex flex-col justify-between h-full">
            <div className="flex-1 mt-5">
              <h1 className="text-xl border-b-2 border-[#E2E8F0]/80 pb-1 w-max text-[#1E293B]">
                Unit 1: Fundamentals of Biology
              </h1>
            </div>
            <div className="h-50.5 border border-gray-400"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Class;

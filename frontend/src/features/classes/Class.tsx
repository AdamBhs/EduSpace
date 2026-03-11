import { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { useParams } from "react-router-dom";
import { IoIosInfinite } from "react-icons/io";
import { FaFolder } from "react-icons/fa";
import CardContent from "./components/CardContent";
import CardFile from "./components/CardFile";
import SearchInput from "./components/SearchInput";
import { useQuery } from "@tanstack/react-query";
import type { Classroom } from "@/shared/types";
import { getClassroomById } from "@/services/classroom-service";
import NavLinksClass from "./components/NavLinksClass";

const Class = () => {
  const [activeUnit, setActiveUnit] = useState("All Topics");
  const user = JSON.parse(localStorage.getItem("user")!);

  const { classId } = useParams();

  const { data, isLoading, error } = useQuery<Classroom>({
    queryKey: ["classroom"],
    queryFn: () => getClassroomById(classId!),
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (error) return <p>Error...</p>;

  const isTeacher = user.userId === data!.teacher_id;

  // TODO: This will change based on the Units on that specifique class class
  const units = ["All Topics", "Unit 1", "Unit 2"];

  const unitSections = [
    { name: "Unit 1", title: "Unit 1: Fundamentals of Biology" },
    { name: "Unit 2", title: "Unit 2: Fundamentals of Biology" },
  ];

  const filteredUnitSections =
    activeUnit === "All Topics"
      ? unitSections
      : unitSections.filter((section) => section.name === activeUnit);

  const handleFilterByUnit = (unit: any) => {
    setActiveUnit(unit);
  };

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <aside className="w-60 self-stretch border-r border-[#E2E8F0] px-6 py-5">
        {isTeacher && (
          <div
            className="text-sm font-semibold rounded-lg cursor-pointer hover:opacity-90 text-white bg-[#137FEC] py-3 px-5 flex gap-1 items-center justify-center"
            style={{ boxShadow: "0 2px 10px rgba(19, 127, 236, 0.5)" }}
          >
            <IoMdAdd size={18} /> Create Work
          </div>
        )}
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
      <section className="flex min-h-0 flex-1 flex-col pl-6 pb-4">
        <NavLinksClass
          isTeacher={isTeacher}
          classId={classId!}
          activeTab="Classwork"
        />
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto py-2 text-sm text-slate-600 pr-6">
          <SearchInput />
          <div className="flex flex-col gap-2.5 justify-between flex-1 min-h-0">
            {filteredUnitSections.map((section) => (
              <div key={section.name} className="mt-5">
                <h1 className="text-xl border-b border-[#E2E8F0]/80 pb-1  text-[#1E293B] mb-4">
                  {section.title}
                </h1>
                <CardContent />
                <CardContent />
                <CardContent />
              </div>
            ))}

            <div className="mt-6 ">
              <h3 className="text-[#94A3B8] font-medium mb-4">
                RECENT SHARED FILES
              </h3>
              <div className="flex gap-4">
                <CardFile />
                <CardFile />
                <CardFile />
                <CardFile />
                <CardFile />
                <CardFile />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Class;

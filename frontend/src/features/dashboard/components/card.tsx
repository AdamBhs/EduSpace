import React from "react";
import { GoDotFill } from "react-icons/go";
import { FaRegFolder } from "react-icons/fa";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { HiArrowTrendingUp } from "react-icons/hi2";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

const card = ({ data }: any) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isTeacher = user.userId === data.teacher_id;
// TODO: i want when i click on one of the card nav to that class but i want the sidebar change to be hiddden and when i click on the button menu humbergeur it show but it don't take space

  const handleClickNav = () => {
    const classId = String(data?.classId ?? "");
    const classCode = classId.slice(0, 6);
    navigate(`/c/${classCode}`, {
      state: {
        breadcrumb: {
          name: data?.name ?? "",
          description: data?.description ?? "",
        },
      },
    });
  };
  return (
    <div
      onClick={handleClickNav}
      className="rounded-lg border border-[#b8b8b8] w-76 max-h-75 overflow-hidden hover:shadow-md cursor-pointer"
    >
      <div className="bg-[#137FEC] p-4 text-white relative">
        <h1 className="font-bold text-xl hover:underline">
          Advanced Mathematics 101
        </h1>
        <p className="text-white/80 text-[14px] font-semibold">
          Room 302 Semester 1
        </p>
        <p className="text-[12px] font-semibold mt-3">Dr. Aris Thorne</p>
        <Avatar
          size="xl"
          className="absolute bottom-0 right-3 translate-y-1/2 size-15  shadow-md"
        >
          <AvatarFallback className="bg-blue-400 text-white font-bold text-xl">
            AT
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="p-4 h-34">
        <p className="text-[12px]">Due Thurrday: Calculus Quiz</p>
      </div>
      <div className="border-t border-[#b8b8b8] px-4 py-2">
        <div className="flex justify-end gap-3">
          <div className="relative group flex justify-center items-center p-2 rounded-full hover:bg-gray-200">
            <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
              {isTeacher ? "Progress" : "People"}
            </span>
            {isTeacher ? (
              <HiArrowTrendingUp className="text-xl" />
            ) : (
              <FaRegUserCircle className="text-xl" />
            )}
          </div>
          <div className="relative group flex justify-center items-center p-2 rounded-full hover:bg-gray-200">
            <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
              Classwork
            </span>
            <FaRegFolder className="text-xl" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative group flex justify-center items-center p-2 rounded-full hover:bg-gray-200">
                <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                  More
                </span>
                <HiOutlineDotsVertical className="text-xl" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-40">
              <DropdownMenuItem>View class</DropdownMenuItem>
              <DropdownMenuItem>Edit class</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                Delete class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default card;

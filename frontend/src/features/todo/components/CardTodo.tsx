import { FaIdBadge } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { HiOutlineDotsVertical } from "react-icons/hi";

const CardTodo = () => {
  return (
    <div className="mt-8">
      <h2 className="font-bold text-[14px] text-[#64748B]">NO DUE DATE</h2>

      <div className="flex items-center justify-between my-4 p-4 border border-[#E2E8F0] rounded-[12px]">
        <div className="flex gap-4">
          <div className="p-3 rounded-md bg-[#E0E7FF] w-max text-[#4F46E5]">
            <FaIdBadge size={22} />
          </div>

          <div>
            <h3 className="text-[#0F172A]">Course Introduction & Syllabus</h3>
            <p className="text-[#64748B] font-normal text-[14px]">
              Molecular Biology
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-[12px] text-[#94A3B8]">No due date</p>

          <div className="px-3 py-1 bg-[#F1F5F9] rounded-full text-[12px]">
            ASSIGNED
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative group flex justify-center items-center p-2 rounded-full hover:bg-gray-200 cursor-pointer">
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

export default CardTodo;

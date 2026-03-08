import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { UserType } from "@/shared/types";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdOutlineMailOutline } from "react-icons/md";

type Props = {
  user: UserType;
  isLast?: boolean;
};

const PeopleCard = ({ user, isLast }: Props) => {
  return (
    <div
      className={`flex justify-between items-center px-4 py-4 border-b border-[#d6dce4] ${isLast || user.role === "teacher" ? "border-b-0" : ""}`}
    >
      <div className="flex items-center gap-6">
        <Avatar>
          <AvatarImage
            src="https://github.com/shadcn.png"
            alt="@shadcn"
            className="grayscale"
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-[#0F172A]">
            {user.role === "teacher"
              ? `Dr. ${user.userName} ${user.userLastName}`
              : `${user.userName} ${user.userLastName}`}
          </h3>
        </div>
      </div>

      {user.role === "teacher" ? (
        <div className="p-2 rounded-full hover:bg-[#dbedff] text-[#94A3B8] hover:text-[#137FEC] cursor-pointer transition duration-100">
          <MdOutlineMailOutline size={22} />
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default PeopleCard;

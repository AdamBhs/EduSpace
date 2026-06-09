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
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdOutlineMailOutline } from "react-icons/md";
import { MessageSquare } from "lucide-react";

type Props = {
  user: {
    userId: string;
    email?: string;
    userName: string;
    userLastName: string;
    avatarUrl: string | null;
    role: string;
  };
  isLast?: boolean;
  isCreator?: boolean;
  viewerIsAdmin?: boolean;
  viewerUserId?: string;
  classroomType?: "TEACHING" | "FRIENDLY";
  onRemove?: () => void;
  onPromote?: () => void;
  onDemote?: () => void;
  onMessage?: () => void;
};

const PeopleCard = ({
  user,
  isLast,
  isCreator,
  viewerIsAdmin,
  viewerUserId,
  classroomType,
  onRemove,
  onPromote,
  onDemote,
  onMessage,
}: Props) => {
  const isAdmin = user.role === "ADMIN";
  const initials = `${user.userName?.[0] ?? ""}${user.userLastName?.[0] ?? ""}`.toUpperCase() || "?";
  const displayName = `${user.userName} ${user.userLastName}`.trim();
  const isSelf = user.userId === viewerUserId;
  const isTeaching = classroomType === "TEACHING";

  const handleEmail = () => {
    if (user.email) {
      window.open(`mailto:${user.email}`, "_blank");
    }
  };

  return (
    <div
      className={`flex justify-between items-center px-4 py-4 border-b border-[#d6dce4] ${isLast || isAdmin ? "border-b-0" : ""}`}
    >
      <div className="flex items-center gap-6">
        <Avatar>
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-[#0F172A]">
            {displayName}
            {isCreator && (
              <span className="ml-2 text-xs text-[#94A3B8]">(Creator)</span>
            )}
          </h3>
        </div>
      </div>

      {isAdmin && !viewerIsAdmin ? (
        <div className="flex items-center gap-1">
          {!isSelf && onMessage && (
            <button
              onClick={onMessage}
              className="p-2 rounded-full hover:bg-[#dbedff] text-[#94A3B8] hover:text-[#137FEC] cursor-pointer transition duration-100"
              title="Send message"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleEmail}
            className="p-2 rounded-full hover:bg-[#dbedff] text-[#94A3B8] hover:text-[#137FEC] cursor-pointer transition duration-100"
            title="Send email"
          >
            <MdOutlineMailOutline size={22} />
          </button>
        </div>
      ) : viewerIsAdmin ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative group flex justify-center items-center p-2 rounded-full hover:bg-gray-200 cursor-pointer">
              <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                More
              </span>
              <HiOutlineDotsVertical className="text-xl" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            {!isSelf && onMessage && (
              <DropdownMenuItem className="cursor-pointer" onClick={onMessage}>
                Send message
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer" onClick={handleEmail}>
              Send email
            </DropdownMenuItem>
            {!isSelf && !isCreator && !isAdmin && onPromote && (
              <DropdownMenuItem className="cursor-pointer" onClick={onPromote}>
                Promote to {isTeaching ? "Teacher" : "Admin"}
              </DropdownMenuItem>
            )}
            {!isSelf && !isCreator && isAdmin && onDemote && (
              <DropdownMenuItem className="cursor-pointer" onClick={onDemote}>
                Demote to {isTeaching ? "Student" : "Member"}
              </DropdownMenuItem>
            )}
            {!isSelf && !isCreator && onRemove && (
              <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={onRemove}>
                Remove
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
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
            {!isSelf && onMessage && (
              <DropdownMenuItem className="cursor-pointer" onClick={onMessage}>
                Send message
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer" onClick={handleEmail}>
              Send email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default PeopleCard;

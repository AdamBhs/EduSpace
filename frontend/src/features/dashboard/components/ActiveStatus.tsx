import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriendsWithStatus, createConversation } from "@/services/dm-service";
import { getUsers } from "@/services/user-service";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { UserSummary } from "@/shared/types";

const ActiveStatus = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends-status"],
    queryFn: getFriendsWithStatus,
    refetchInterval: 30000,
  });

  const friendIds = friends?.map((f) => f.userId) ?? [];

  const { data: users } = useQuery<UserSummary[]>({
    queryKey: ["users", friendIds],
    queryFn: () => getUsers(friendIds),
    enabled: friendIds.length > 0,
  });

  const userMap = new Map(users?.map((u) => [u.userId, u]) ?? []);

  const handleClick = async (friendId: string) => {
    const conv = await createConversation(friendId);
    navigate(`/messages/${conv.id}`);
  };

  if (isLoading) return null;
  if (!friends || friends.length === 0) return null;

  const onlineCount = friends.filter((f) => f.online).length;

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mb-2 cursor-pointer w-full group"
      >
        <h2 className="text-sm font-semibold text-[#0F172A]">Active Status</h2>
        {onlineCount > 0 && (
          <span className="text-xs text-[#64748B]">{onlineCount} online</span>
        )}
        <div className="ml-auto text-[#94A3B8] group-hover:text-[#64748B]">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-1">
          {friends.map((friend) => {
            const u = userMap.get(friend.userId);
            const initials = u
              ? `${u.userName?.[0] ?? ""}${u.userLastName?.[0] ?? ""}`.toUpperCase()
              : "?";
            const fullName = u
              ? `${u.userName ?? ""} ${u.userLastName ?? ""}`.trim()
              : "User";

            return (
              <button
                key={friend.userId}
                onClick={() => handleClick(friend.userId)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#F1F5F9] cursor-pointer transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback
                      className={`text-xs font-semibold ${
                        friend.online
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      friend.online ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] truncate">{fullName}</p>
                  <p className={`text-xs ${friend.online ? "text-green-600" : "text-[#94A3B8]"}`}>
                    {friend.online ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveStatus;

import { useState } from "react";
import { FaRegFolder } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { HiArrowTrendingUp } from "react-icons/hi2";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import type { EnrolledClassroom } from "@/shared/types";
import { deleteClassroomById, leaveClassroom, updateClassroom } from "@/services/classroom-service";
import { Trash2, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Props = {
  data: EnrolledClassroom;
};

const Card = ({ data }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = data.role === "ADMIN";
  const isCreator = user?.userId === data.classroom.creatorId;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteClassroomById(data.classroom.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveClassroom(data.classroom.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => updateClassroom(data.classroom.id, { archived: !data.classroom.archived }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const handleClickNav = () => {
    localStorage.setItem("sidebarHidden", "true");
    navigate(`/c/${data.classroom.id}`, {
      state: {
        breadcrumb: { name: data.classroom.name },
        className: data.classroom.name,
      },
    });
  };

  const creatorName = data.creator
    ? `${data.creator.userName ?? ""} ${data.creator.userLastName ?? ""}`.trim()
    : "";
  const creatorInitials = data.creator
    ? `${data.creator.userName?.[0] ?? ""}${data.creator.userLastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  const isTeaching = data.classroom.type === "TEACHING";
  const roleLabel = isTeaching
    ? (isAdmin ? "Teacher" : "Student")
    : (isAdmin ? "Admin" : "Member");

  // Deterministic, varied header color per classroom (uses coverImage if set).
  const HEADER_GRADIENTS = [
    "linear-gradient(135deg, #137FEC, #0A5BB5)",
    "linear-gradient(135deg, #8B5CF6, #6D28D9)",
    "linear-gradient(135deg, #EC4899, #BE185D)",
    "linear-gradient(135deg, #10B981, #047857)",
    "linear-gradient(135deg, #F59E0B, #B45309)",
    "linear-gradient(135deg, #06B6D4, #0E7490)",
    "linear-gradient(135deg, #6366F1, #4338CA)",
    "linear-gradient(135deg, #F43F5E, #9F1239)",
  ];
  const gradientIndex = Array.from(data.classroom.id).reduce(
    (sum, ch) => sum + ch.charCodeAt(0),
    0,
  ) % HEADER_GRADIENTS.length;
  const cover = data.classroom.coverImage;
  const headerStyle = cover?.startsWith("http")
    ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: HEADER_GRADIENTS[gradientIndex] };

  return (
    <div className="rounded-lg border border-[#b8b8b8] w-80 max-w-80 overflow-hidden hover:shadow-md cursor-pointer">
      <div
        onClick={handleClickNav}
        style={headerStyle}
        className="p-4 text-white relative h-27.75"
      >
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-bold text-xl hover:underline truncate">
            {data.classroom.name}
          </h1>
          <Badge
            className={`text-[10px] shrink-0 ${
              isTeaching
                ? "bg-white/20 text-white border-white/30"
                : "bg-emerald-400/20 text-emerald-100 border-emerald-300/30"
            }`}
          >
            {isTeaching ? "Teaching" : "Friendly"}
          </Badge>
          {data.classroom.archived && (
            <Badge className="text-[10px] shrink-0 bg-white/25 text-white border-white/40">
              Archived
            </Badge>
          )}
        </div>
        <p className="text-white/80 text-[14px] font-semibold truncate">
          {data.classroom.description || data.classroom.section}
        </p>
        <p className="text-[12px] font-semibold mt-3">
          {isTeaching && creatorName ? `Dr. ${creatorName}` : creatorName}
        </p>
        <Avatar
          size="xl"
          className="absolute bottom-0 right-3 translate-y-1/2 size-15 shadow-md"
        >
          <AvatarImage src={data.creator?.avatarUrl ?? undefined} alt="" className="object-cover" />
          <AvatarFallback className="bg-blue-400 text-white font-bold text-xl">
            {creatorInitials}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="p-4 h-34 max-h-34 overflow-hidden">
        <p className="text-[12px] text-gray-500">
          {data.classroom._count?.members ?? 0} members &middot; {roleLabel}
        </p>
      </div>
      <div className="border-t border-[#b8b8b8] px-4 py-2">
        <div className="flex justify-end gap-3">
          <div className="relative group flex justify-center items-center p-2 rounded-full hover:bg-gray-200">
            <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
              {isAdmin ? "Progress" : "People"}
            </span>
            {isAdmin ? (
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
              <DropdownMenuItem
                onClick={handleClickNav}
                className="cursor-pointer"
              >
                View class
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => archiveMutation.mutate()}
                  className="cursor-pointer"
                >
                  {data.classroom.archived ? "Unarchive class" : "Archive class"}
                </DropdownMenuItem>
              )}
              {isCreator && (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setDeleteOpen(true);
                  }}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  Delete class
                </DropdownMenuItem>
              )}
              {!isCreator && (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setLeaveOpen(true);
                  }}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  Leave class
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete dialog */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete classroom?</DialogTitle>
                <DialogDescription>
                  This action can't be undone. The classroom and its content
                  will be permanently removed.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-700">
                  <Trash2 className="size-4" />
                </div>
                <div className="text-sm text-red-900">
                  You're about to delete{" "}
                  <span className="font-semibold">{data.classroom.name}</span>.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteMutation.mutate();
                    setDeleteOpen(false);
                  }}
                  className="cursor-pointer hover:bg-red-700"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete class"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Leave dialog */}
          <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Leave classroom?</DialogTitle>
                <DialogDescription>
                  You will no longer have access to this classroom.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                  <LogOut className="size-4" />
                </div>
                <div className="text-sm text-amber-900">
                  You're about to leave{" "}
                  <span className="font-semibold">{data.classroom.name}</span>.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLeaveOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    leaveMutation.mutate();
                    setLeaveOpen(false);
                  }}
                  disabled={leaveMutation.isPending}
                >
                  {leaveMutation.isPending ? "Leaving..." : "Leave class"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Card;

import { useState } from "react";
import { FaRegFolder } from "react-icons/fa";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
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
import type { EnrolledClassroom } from "@/shared/types";
import { deleteClassroomById } from "@/services/classroom-service";
import { Trash2 } from "lucide-react";

type Props = {
  data: EnrolledClassroom;
};

const card = ({ data }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isTeacher = user.userId === data.classroom.teacher_id;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClassroomById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
    onError: (err: any) => {
      console.error("Failed to delete classroom:", err);
    },
  });

  const handleClickNav = () => {
    localStorage.setItem("sidebarHidden", "true");
    const classId = data.classroom.classId;
    const classUrlCode = classId;
    navigate(`/c/${classUrlCode}`, {
      state: {
        breadcrumb: {
          name: data.classroom.name,
        },
        className: data.classroom.name,
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(data.classroom.classId);
  };

  const handleDeleteConfirm = () => {
    handleDelete();
    setDeleteOpen(false);
  };
  return (
    <div className="rounded-lg border border-[#b8b8b8] w-80 max-w-80  overflow-hidden hover:shadow-md cursor-pointer">
      <div
        onClick={handleClickNav}
        className="bg-[#137FEC] p-4 text-white relative h-27.75"
      >
        <h1 className="font-bold text-xl hover:underline">
          {data.classroom.name}
        </h1>
        <p className="text-white/80 text-[14px] font-semibold">
          {data.classroom.description}
        </p>
        <p className="text-[12px] font-semibold mt-3">
          Dr. {data.teacher.userName} {data.teacher.userLastName}
        </p>
        <Avatar
          size="xl"
          className="absolute bottom-0 right-3 translate-y-1/2 size-15  shadow-md"
        >
          <AvatarFallback className="bg-blue-400 text-white font-bold text-xl">
            AT
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="p-4 h-34 max-h-34 overflow-hidden">
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
              <DropdownMenuItem className="cursor-pointer">
                View class
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Edit class
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setDeleteOpen(true);
                }}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                Delete class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  onClick={handleDeleteConfirm}
                  className="cursor-pointer hover:bg-red-700"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete class"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default card;

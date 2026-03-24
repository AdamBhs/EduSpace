import NavLinksClass from "../components/NavLinksClass";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import { getClassroomById } from "@/services/classroom-service";
import { IoMdExpand } from "react-icons/io";
import { useState, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { MdOutlineEdit } from "react-icons/md";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Cloud, Link2, Paperclip, PlayCircle, ChevronDown } from "lucide-react";
const Stream = () => {
  const { classId } = useParams<{ classId: string }>();
  const user = JSON.parse(localStorage.getItem("user")!); // Return Object
  const [isExpanded, setIsExpanded] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    message: "",
  });
  console.log("stream: ", user);
  const {
    data: classroom,
    isLoading: classLoading,
    error: classError,
  } = useQuery({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  if (classLoading) return <PeopleSkeleton />;
  if (classError) return <p>Error loading data</p>;

  const isTeacher = user.userId === classroom.teacher_id;

  const handlePostChange = (value: string) => {
    setPostForm({ message: value });
  };

  const handlePostClose = (open: boolean) => {
    setPostDialogOpen(open);
    if (!open) {
      setPostForm({ message: "" });
    }
  };

  const handlePostSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postForm.message.trim()) return;
    console.log("Stream post draft:", postForm);
    setPostForm({ message: "" });
    setPostDialogOpen(false);
  };

  return (
    <>
      <NavLinksClass
        isTeacher={isTeacher}
        classId={classId!}
        activeTab="Stream"
      />
      <div className="pt-6 px-75 flex flex-col">
        <div className="flex flex-col text-white justify-end h-64 rounded-3xl px-8 py-8 bg-linear-to-r from-[#000000]/70 to-[#000000]/20">
          <h1 className="font-bold text-4xl">Frontend</h1>
          <p>Section A • 2024-2025</p>
        </div>
        <div className="flex gap-6 mt-6">
          <div className="w-63.5">
            <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg">
              <h4 className="font-bold text-[14px] ">Upcoming Work</h4>
              <div>
                <p className="text-[#64748B] text-[12px]">
                  Due Friday, 11:59 PM
                </p>
                <h3 className="text-[14px]">Lab Report #4: Mitochondria</h3>
              </div>
              <div>
                <p className="text-[#64748B] text-[12px]">
                  Due Friday, 11:59 PM
                </p>
                <h3 className="text-[14px]">Lab Report #4: Mitochondria</h3>
              </div>
              <p className="text-[#137FEC] text-[12px] rounded-full hover:bg-[#137FEC]/10 w-max cursor-pointer px-3 py-2 justify-end">
                View all
              </p>
            </div>
            <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg mt-4">
              <h4 className="font-bold text-[14px] ">Class Code</h4>
              <div className="flex justify-between items-center">
                <h2 className="text-[#137FEC] font-medium text-[18px]">
                  {classroom.class_code}
                </h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex justify-center items-center w-8 h-8 cursor-pointer rounded-full hover:bg-[#94A3B8]/10">
                      <IoMdExpand className="text-[#94A3B8] " />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-175 ">
                    <DialogHeader>
                      <DialogTitle>Class code</DialogTitle>
                      <DialogDescription>
                        Share this code with students to join the class.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center rounded-lg border bg-[#F8FAFC] py-6">
                      <span
                        className="text-8xl
                       font-semibold tracking-widest text-[#137FEC]"
                      >
                        {classroom.class_code}
                      </span>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Dialog open={postDialogOpen} onOpenChange={handlePostClose}>
              <DialogTrigger asChild>
                <div
                  className={`w-full p-4 flex gap-4 cursor-pointer border border-[#E2E8F0] rounded-lg justify-between overflow-hidden transition-all duration-300 h-18`}
                >
                  <div className="flex w-full items-center justify-between h-10">
                    <div className="flex gap-4 items-center">
                      <Avatar>
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="@shadcn"
                          className="grayscale"
                        />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <h3 className="text-[#64748B]">
                        Share something with your class...
                      </h3>
                    </div>
                    <div className="w-8 h-8 flex justify-center items-center rounded-full cursor-pointer hover:bg-gray-200">
                      <MdOutlineEdit className="text-xl" />
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-180 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#E2E8F0] text-left">
                  <DialogTitle className="text-[16px] font-semibold text-[#0F172A]">
                    Post Announcement
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Post an announcement to the class stream
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePostSubmit}>
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="@shadcn"
                          className="grayscale"
                        />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {isTeacher
                            ? `Dr. ${user?.profile?.firstName ?? ""} ${user?.profile?.lastName ?? ""}`.trim()
                            : `${user?.userName ?? ""} ${user?.userLastName ?? ""}`.trim()}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {classroom.subject} • Section {classroom.section}
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={postForm.message}
                      onChange={(e) => handlePostChange(e.target.value)}
                      placeholder="Share something with your class..."
                      className="mt-4 min-h-48 w-full resize-none border-none bg-transparent p-0 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none"
                    />
                  </div>

                  <div className="px-6 pb-5">
                    <p className="text-[11px] tracking-wide text-[#94A3B8] uppercase mb-3">
                      Add to your post
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                      >
                        <Paperclip className="h-4 w-4 text-[#2563EB]" />
                        Upload file
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                      >
                        <Cloud className="h-4 w-4 text-[#16A34A]" />
                        Google Drive
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                      >
                        <PlayCircle className="h-4 w-4 text-[#EF4444]" />
                        Youtube
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                      >
                        <Link2 className="h-4 w-4 text-[#2563EB]" />
                        Link
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-[#64748B]"
                      onClick={() => handlePostClose(false)}
                    >
                      Cancel
                    </Button>
                    <div className="flex">
                      <Button type="submit" className="rounded-r-none">
                        Post
                      </Button>
                      <Button
                        type="button"
                        className="rounded-l-none border-l border-white/20 px-2"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
};

export default Stream;

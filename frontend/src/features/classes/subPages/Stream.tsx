import NavLinksClass from "../components/NavLinksClass";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import { getClassroomById } from "@/services/classroom-service";
import { IoMdExpand } from "react-icons/io";
import { useState } from "react";
import type { FormEvent } from "react";
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
import { useGooglePicker } from "@/shared/hooks/useGooglePicker";

type StreamPost = {
  id: string;
  message: string;
  links: string[];
  createdAt: string;
  authorName: string;
  authorRole: "teacher" | "student";
};

const Stream = () => {
  const { classId } = useParams<{ classId: string }>();
  const user = JSON.parse(localStorage.getItem("user")!); // Return Object
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    message: "",
  });
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [pendingLink, setPendingLink] = useState("");
  const [attachedLinks, setAttachedLinks] = useState<string[]>([]);
  const [posts, setPosts] = useState<StreamPost[]>([]);

  const { openPicker } = useGooglePicker({
    onFilePicked: (file) => {
      console.log("File selected: ", file);
    },
  });

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
      setAttachedLinks([]);
      setPendingLink("");
    }
  };

  const handlePostSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postForm.message.trim() && attachedLinks.length === 0) return;
    const authorName = isTeacher
      ? `Dr. ${user?.profile.firstName ?? ""} ${user?.profile.lastName ?? ""}`.trim()
      : `${user?.userName ?? ""} ${user?.userLastName ?? ""}`.trim();
    const newPost: StreamPost = {
      id: `${Date.now()}`,
      message: postForm.message.trim(),
      links: attachedLinks,
      createdAt: new Date().toISOString(),
      authorName: authorName || "Unknown",
      authorRole: isTeacher ? "teacher" : "student",
    };
    setPosts((prev) => [newPost, ...prev]);
    setPostForm({ message: "" });
    setAttachedLinks([]);
    setPendingLink("");
    setPostDialogOpen(false);
  };

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col pl-6 pb-4">
        <NavLinksClass
          isTeacher={isTeacher}
          classId={classId!}
          activeTab="Stream"
        />
        <div className="px-75 flex flex-col pt-16 h-screen overflow-y-auto">
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
                          className="text-8xli want you know when i click post it take the links and the comment i type in textarea and put that post in 
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
                              ? `Dr. ${user?.profile.firstName ?? ""} ${user?.profile.lastName ?? ""}`.trim()
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
                      {attachedLinks.length > 0 && (
                        <div className="mt-3 max-h-36 space-y-2 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                          {attachedLinks.map((link, index) => (
                            <div
                              key={`${link}-${index}`}
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2 text-sm text-[#0F172A]">
                                <Link2 className="h-4 w-4 text-[#2563EB]" />
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-[#2563EB] line-clamp-1"
                                >
                                  {link}
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setAttachedLinks((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )
                                }
                                className="text-xs cursor-pointer text-[#64748B] hover:text-[#0F172A]"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-6 pb-5">
                      <p className="text-[11px] tracking-wide text-[#94A3B8] uppercase mb-3">
                        Add to your post
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={openPicker}
                          className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                        >
                          <Paperclip className="h-4 w-4 text-[#2563EB]" />
                          Upload file
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
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
                        <Dialog
                          open={linkDialogOpen}
                          onOpenChange={(open) => {
                            setLinkDialogOpen(open);
                            if (!open) setPendingLink("");
                          }}
                        >
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                            >
                              <Link2 className="h-4 w-4 text-[#2563EB]" />
                              Link
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-140">
                            <DialogHeader>
                              <DialogTitle>Add a link</DialogTitle>
                              <DialogDescription>
                                Paste a URL to attach it to your post.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <input
                                value={pendingLink}
                                onChange={(e) => setPendingLink(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A] focus:outline-none"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="text-[#64748B]"
                                  onClick={() => setLinkDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (!pendingLink.trim()) return;
                                    setAttachedLinks((prev) => [
                                      ...prev,
                                      pendingLink.trim(),
                                    ]);
                                    setLinkDialogOpen(false);
                                    setPendingLink("");
                                  }}
                                  className="cursor-pointer"
                                >
                                  Add Link
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
                        <Button
                          type="submit"
                          className=" cursor-pointer rounded-r-none"
                        >
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
              {/* fixed: added post */}
              <div className="mt-6 space-y-4">
                {posts.length === 0 && (
                  <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
                    No posts yet. Be the first to share something.
                  </div>
                )}
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src="https://github.com/shadcn.png"
                            alt="@shadcn"
                            className="grayscale"
                          />
                          <AvatarFallback>
                            {post.authorName.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">
                            {post.authorName}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {post.message && (
                      <p className="mt-4 text-sm text-[#0F172A] whitespace-pre-wrap">
                        {post.message}
                      </p>
                    )}
                    {post.links.length > 0 && (
                      <div className="mt-4 space-y-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                        {post.links.map((link, index) => (
                          <div
                            key={`${post.id}-link-${index}`}
                            className="flex items-center gap-2"
                          >
                            <Link2 className="h-4 w-4 text-[#2563EB]" />
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#2563EB] line-clamp-1"
                            >
                              {link}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Stream;

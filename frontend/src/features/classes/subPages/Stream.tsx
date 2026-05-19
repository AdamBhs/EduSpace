import { useState } from "react";
import NavLinksClass from "../components/NavLinksClass";
import CreatePostDialog from "../components/CreatePostDialog";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassroomById } from "@/services/classroom-service";
import { getPostsByClass } from "@/services/content-service";
import { IoMdExpand } from "react-icons/io";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import StreamSkeleton from "../ui/StreamSkeleton";
import { useAuth } from "@/context/AuthContext";
import type { Classroom, Post } from "@/shared/types";
import { FileText, HelpCircle, ClipboardList, Megaphone, BookOpen } from "lucide-react";

const postTypeIcon = (type: string) => {
  switch (type) {
    case "STUDY_MATERIAL": return <BookOpen className="w-4 h-4 text-[#137FEC]" />;
    case "ASSIGNMENT": return <ClipboardList className="w-4 h-4 text-green-600" />;
    case "QUIZ": return <FileText className="w-4 h-4 text-purple-600" />;
    case "QUESTION": return <HelpCircle className="w-4 h-4 text-amber-600" />;
    case "ANNOUNCEMENT": return <Megaphone className="w-4 h-4 text-red-500" />;
    default: return <FileText className="w-4 h-4 text-gray-500" />;
  }
};

const Stream = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: classroom,
    isLoading: classLoading,
    error: classError,
  } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery<Post[]>({
    queryKey: ["posts", classId],
    queryFn: () => getPostsByClass(classId!),
    enabled: !!classId,
  });

  if (classLoading || postsLoading) return <StreamSkeleton />;
  if (classError || postsError) return <p>Error loading data</p>;

  const isAdmin = classroom?.userRole === "ADMIN";
  const isTeaching = classroom?.type === "TEACHING";
  const allPosts = posts ?? [];

  const userInitials = user?.profile
    ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col pl-6 pb-4">
        <NavLinksClass
          classId={classId!}
          activeTab="Stream"
          classroomType={classroom!.type}
          userRole={classroom!.userRole!}
          chatEnabled={classroom!.chatEnabled}
        />
        <div className="px-75 flex flex-col pt-16 h-screen overflow-y-auto">
          <div className="flex flex-col text-white justify-end h-64 rounded-3xl px-8 py-8 bg-linear-to-r from-[#000000]/70 to-[#000000]/20">
            <h1 className="font-bold text-4xl">{classroom?.name}</h1>
            <p>
              {classroom?.section ? `Section ${classroom.section}` : ""}
              {classroom?.section && classroom?.subject ? " · " : ""}
              {classroom?.subject ?? ""}
            </p>
          </div>
          <div className="flex gap-6 mt-6">
            <div className="w-63.5">
              {isTeaching && (
                <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg">
                  <h4 className="font-bold text-[14px]">Upcoming Work</h4>
                  <p className="text-[#64748B] text-[12px]">
                    No upcoming assignments
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg mt-4">
                <h4 className="font-bold text-[14px]">Class Code</h4>
                <div className="flex justify-between items-center">
                  <h2 className="text-[#137FEC] font-medium text-[18px]">
                    {classroom?.classCode}
                  </h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="flex justify-center items-center w-8 h-8 cursor-pointer rounded-full hover:bg-[#94A3B8]/10">
                        <IoMdExpand className="text-[#94A3B8]" />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-175">
                      <DialogHeader>
                        <DialogTitle>Class code</DialogTitle>
                        <DialogDescription>
                          Share this code with others to join the class.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center justify-center rounded-lg border bg-[#F8FAFC] py-6">
                        <span className="text-[60px] font-semibold tracking-widest text-[#137FEC]">
                          {classroom?.classCode}
                        </span>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
            <div className="flex-1">
              {isAdmin && (
                <>
                  <div
                    onClick={() => setCreateOpen(true)}
                    className="w-full p-4 flex gap-4 cursor-pointer border border-[#E2E8F0] rounded-lg overflow-hidden h-18 mb-4 hover:border-[#137FEC]/40 transition-colors"
                  >
                    <div className="flex w-full items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-[#64748B]">
                        Share something with your class...
                      </h3>
                    </div>
                  </div>
                  <CreatePostDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    classId={classId!}
                    classroomType={classroom!.type}
                    chapters={classroom!.chapters ?? []}
                  />
                </>
              )}

              <div className="space-y-4">
                {allPosts.length === 0 && (
                  <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
                    No posts yet. {isAdmin ? "Create the first post." : "Check back later."}
                  </div>
                )}
                {allPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-5 hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                        {postTypeIcon(post.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {post.title}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {post.type.replace("_", " ")}
                          {post.studyMaterialType ? ` · ${post.studyMaterialType}` : ""}
                          {" · "}
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {post.content && (
                      <p className="mt-3 text-sm text-[#334155] line-clamp-3">
                        {post.content}
                      </p>
                    )}
                    {post._count?.comments !== undefined && post._count.comments > 0 && (
                      <p className="mt-2 text-xs text-[#137FEC]">
                        {post._count.comments} comment{post._count.comments !== 1 ? "s" : ""}
                      </p>
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

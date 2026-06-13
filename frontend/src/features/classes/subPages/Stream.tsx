import { useState, useMemo } from "react";
import NavLinksClass from "../components/NavLinksClass";
import CreatePostDialog from "../components/CreatePostDialog";
import EditPostDialog from "../components/EditPostDialog";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClassroomById } from "@/services/classroom-service";
import { getPostsByClass, deletePost } from "@/services/content-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import StreamSkeleton from "../ui/StreamSkeleton";
import { useAuth } from "@/context/AuthContext";
import type { Classroom, Post } from "@/shared/types";
import { formatDate, formatDateTime } from "@/shared/lib/utils";
import { FileText, HelpCircle, ClipboardList, Megaphone, BookOpen, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";

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

type SortOption = "newest" | "oldest" | "title-az" | "title-za";

const Stream = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [subTypeFilter, setSubTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);

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

  const isAdmin = classroom?.userRole === "ADMIN";
  const isTeaching = classroom?.type === "TEACHING";

  const removePost = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", classId] });
      setDeletingPost(null);
    },
  });

  const allPosts = posts ?? [];

  const filteredPosts = useMemo(() => {
    let list = allPosts;
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (subTypeFilter !== "all" && typeFilter === "STUDY_MATERIAL") {
      list = list.filter((p) => p.studyMaterialType === subTypeFilter);
    }

    switch (sortBy) {
      case "oldest": return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "title-az": return [...list].sort((a, b) => a.title.localeCompare(b.title));
      case "title-za": return [...list].sort((a, b) => b.title.localeCompare(a.title));
      default: return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [allPosts, typeFilter, subTypeFilter, sortBy]);

  const upcomingAssignments = useMemo(() => {
    if (!isTeaching) return [];
    const now = new Date();
    return allPosts
      .filter((p) => (p.type === "ASSIGNMENT" || p.type === "QUIZ" || p.type === "QUESTION") && p.dueDate && new Date(p.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [allPosts, isTeaching]);

  const userInitials = user?.profile
    ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  if (classLoading || postsLoading) return <StreamSkeleton />;
  if (classError || postsError) return <p>Error loading data</p>;

  const POST_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "ANNOUNCEMENT", label: "Announcement" },
    { value: "STUDY_MATERIAL", label: "Study Material" },
    { value: "QUIZ", label: "Quiz" },
    { value: "QUESTION", label: "Question" },
    ...(isTeaching ? [{ value: "ASSIGNMENT", label: "Assignment" }] : []),
  ];

  const SUB_TYPE_OPTIONS = [
    { value: "all", label: "All Materials" },
    { value: "COURS", label: "Cours" },
    { value: "TD", label: "TD" },
    { value: "TP", label: "TP" },
    { value: "RESUME", label: "Résumé" },
  ];

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "title-az", label: "Title A → Z" },
    { value: "title-za", label: "Title Z → A" },
  ];

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
                  {upcomingAssignments.length === 0 ? (
                    <p className="text-[#64748B] text-[12px]">No upcoming assignments</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingAssignments.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => navigate(`/c/${classId}/post/${a.id}`, { state: { postTitle: a.title, postType: a.type } })}
                          className="flex items-center gap-2 text-[12px] cursor-pointer hover:text-[#137FEC] transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span className="truncate flex-1 text-[#334155]">{a.title}</span>
                          <span className="text-[#94A3B8] shrink-0">
                            {formatDate(a.dueDate!)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg mt-4">
                <h4 className="font-bold text-[14px]">Class Code</h4>
                <h2 className="text-[#137FEC] font-medium text-[18px]">
                  {classroom?.classCode}
                </h2>
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

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); if (v !== "STUDY_MATERIAL") setSubTypeFilter("all"); }}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {typeFilter === "STUDY_MATERIAL" && (
                  <Select value={subTypeFilter} onValueChange={setSubTypeFilter}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUB_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredPosts.length === 0 && (
                  <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
                    No posts found. {typeFilter !== "all" ? "Try removing filters." : isAdmin ? "Create the first post." : "Check back later."}
                  </div>
                )}
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/c/${classId}/post/${post.id}`, { state: { postTitle: post.title, postType: post.type } })}
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
                          {formatDateTime(post.createdAt)}
                        </p>
                      </div>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4 text-[#64748B]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setEditingPost(post)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingPost(post)} className="cursor-pointer text-red-600 focus:text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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

        {/* Edit post dialog */}
        {editingPost && (
          <EditPostDialog
            open={!!editingPost}
            onOpenChange={(open) => { if (!open) setEditingPost(null); }}
            post={editingPost}
            classroomType={classroom!.type}
            chapters={classroom!.chapters ?? []}
          />
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={!!deletingPost} onOpenChange={(open) => { if (!open) setDeletingPost(null); }}>
          <DialogContent className="sm:max-w-[400px]" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogDescription className="text-sm text-[#64748B] mt-2">
                Are you sure you want to delete "{deletingPost?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setDeletingPost(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => deletingPost && removePost.mutate(deletingPost.id)}
                disabled={removePost.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {removePost.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
            {removePost.isError && (
              <p className="text-sm text-red-500 text-center">
                {(removePost.error as any)?.response?.data?.error || "Failed to delete post"}
              </p>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
};

export default Stream;

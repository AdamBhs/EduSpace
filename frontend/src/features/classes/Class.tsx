import { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { useParams, useNavigate } from "react-router-dom";
import { IoIosInfinite } from "react-icons/io";
import { FaFolder } from "react-icons/fa";
import SearchInput from "./components/SearchInput";
import CreatePostDialog from "./components/CreatePostDialog";
import { useQuery } from "@tanstack/react-query";
import type { Classroom, Post } from "@/shared/types";
import { getClassroomById } from "@/services/classroom-service";
import { getPostsByClass } from "@/services/content-service";
import NavLinksClass from "./components/NavLinksClass";
import { FileText, HelpCircle, ClipboardList, Megaphone, BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

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

const Class = () => {
  const [activeChapter, setActiveChapter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { classId } = useParams();
  const navigate = useNavigate();

  const { data: classroom, isLoading: classLoading, error: classError } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["posts", classId],
    queryFn: () => getPostsByClass(classId!),
    enabled: !!classId,
  });

  const trimmed = search.trim().toLowerCase();

  if (classLoading) return <p>Loading...</p>;
  if (classError) return <p>Error loading classroom</p>;

  const chapters = classroom?.chapters ?? [];
  const isAdmin = classroom?.userRole === "ADMIN";

  const allPosts = posts ?? [];

  const basePosts = trimmed.length >= 2
    ? allPosts.filter((p) =>
        p.title.toLowerCase().includes(trimmed) ||
        (p.content && p.content.toLowerCase().includes(trimmed)) ||
        p.type.toLowerCase().includes(trimmed)
      )
    : allPosts;

  const filteredPosts = activeChapter === "all"
    ? basePosts
    : basePosts.filter((p) => p.chapterId === activeChapter);

  const postsByChapter = new Map<string, Post[]>();
  for (const post of filteredPosts) {
    const chap = postsByChapter.get(post.chapterId) ?? [];
    chap.push(post);
    postsByChapter.set(post.chapterId, chap);
  }

  const chapterById = new Map(chapters.map((c) => [c.id, c]));

  const orderedChapterIds = chapters
    .map((c) => c.id)
    .filter((id) => postsByChapter.has(id));

  for (const id of postsByChapter.keys()) {
    if (!orderedChapterIds.includes(id)) orderedChapterIds.push(id);
  }

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <aside className="w-60 self-stretch border-r border-[#E2E8F0] px-6 py-5">
        {isAdmin && (
          <>
            <div
              onClick={() => setCreateOpen(true)}
              className="text-sm font-semibold rounded-lg cursor-pointer hover:opacity-90 text-white bg-[#137FEC] py-3 px-5 flex gap-1 items-center justify-center"
              style={{ boxShadow: "0 2px 10px rgba(19, 127, 236, 0.5)" }}
            >
              <IoMdAdd size={18} /> Create Post
            </div>
            <CreatePostDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              classId={classId!}
              classroomType={classroom!.type}
              chapters={chapters}
            />
          </>
        )}
        <h2 className="mt-6 text-[#94A3B8] text-[10px]">CHAPTERS</h2>
        <ul className="mt-4 space-y-1 text-sm text-slate-600">
          <li
            onClick={() => setActiveChapter("all")}
            className={`flex gap-2 items-center select-none cursor-pointer hover:bg-[#137FEC]/10 px-2 py-1.5 rounded-md ${
              activeChapter === "all"
                ? "text-[#137FEC] bg-[#137FEC]/10"
                : "hover:text-[#137FEC]/80"
            }`}
          >
            <IoIosInfinite size={16} />
            All Chapters
          </li>
          {chapters.map((chapter) => (
            <li
              key={chapter.id}
              onClick={() => setActiveChapter(chapter.id)}
              className={`flex gap-2 items-center select-none cursor-pointer hover:bg-[#137FEC]/10 px-2 py-1.5 rounded-md ${
                activeChapter === chapter.id
                  ? "text-[#137FEC] bg-[#137FEC]/10"
                  : "hover:text-[#137FEC]/80"
              }`}
            >
              <FaFolder />
              {chapter.name}
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col pl-6 pb-4">
        <NavLinksClass
          classId={classId!}
          activeTab="Materials"
          classroomType={classroom!.type}
          userRole={classroom!.userRole!}
          chatEnabled={classroom!.chatEnabled}
        />
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto py-2 text-sm text-slate-600 pr-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search posts..."
          />
          <div className="flex flex-col gap-2.5 flex-1 min-h-0 mt-2">
            {filteredPosts.length === 0 && !postsLoading && (
              <div className="flex items-center justify-center h-40 text-gray-400">
                {trimmed.length >= 2 ? "No matching posts" : "No posts yet"}
              </div>
            )}
            {orderedChapterIds.length > 0 && (
              <Accordion type="multiple" defaultValue={orderedChapterIds}>
                {orderedChapterIds.map((chapterId) => {
                  const chapter = chapterById.get(chapterId);
                  const chapterPosts = postsByChapter.get(chapterId) ?? [];
                  return (
                    <AccordionItem key={chapterId} value={chapterId}>
                      <AccordionTrigger className="text-lg text-[#1E293B] hover:no-underline py-3">
                        <div className="flex items-center gap-2">
                          <FaFolder className="w-4 h-4 text-[#94A3B8]" />
                          <span>{chapter?.name ?? "Unknown Chapter"}</span>
                          <span className="text-xs text-[#94A3B8] font-normal ml-1">
                            ({chapterPosts.length})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {chapterPosts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => navigate(`/c/${classId}/post/${post.id}`)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] cursor-pointer border border-transparent hover:border-[#E2E8F0] mb-1"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                              {postTypeIcon(post.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1E293B] truncate">{post.title}</p>
                              <p className="text-xs text-[#94A3B8]">
                                {post.type.replace("_", " ")}
                                {post.studyMaterialType ? ` - ${post.studyMaterialType}` : ""}
                                {" · "}
                                {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {post._count?.comments !== undefined && (
                              <span className="text-xs text-[#94A3B8]">
                                {post._count.comments} {post._count.comments === 1 ? "comment" : "comments"}
                              </span>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Class;

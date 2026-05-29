import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassroomById } from "@/services/classroom-service";
import { getPostsByClass } from "@/services/content-service";
import NavLinksClass from "../components/NavLinksClass";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { Classroom, Post } from "@/shared/types";
import type { EventClickArg } from "@fullcalendar/core";

const Assignments = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const {
    data: classroom,
    isLoading: classLoading,
    error: classError,
  } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["posts", classId],
    queryFn: () => getPostsByClass(classId!),
    enabled: !!classId,
  });

  const events = useMemo(() => {
    if (!posts) return [];
    return posts
      .filter((p) => p.type === "ASSIGNMENT" && p.dueDate)
      .map((p) => ({
        id: p.id,
        title: p.title,
        date: p.dueDate!,
        color: p.maxPoints ? "#16a34a" : "#2563eb",
        extendedProps: { postId: p.id },
      }));
  }, [posts]);

  const handleEventClick = (info: EventClickArg) => {
    const postId = info.event.extendedProps.postId;
    if (postId) navigate(`/c/${classId}/post/${postId}`);
  };

  if (classLoading) return <div className="p-6 text-sm text-[#64748B]">Loading...</div>;
  if (classError) return <div className="p-6 text-sm text-red-500">Error loading classroom</div>;

  if (classroom?.type === "FRIENDLY") {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Assignments are not available in friendly classrooms
      </div>
    );
  }

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col pb-4">
        <NavLinksClass
          classId={classId!}
          activeTab="Assignments"
          classroomType={classroom!.type}
          userRole={classroom!.userRole!}
          chatEnabled={classroom!.chatEnabled}
        />
        <div className="flex-1 overflow-y-auto px-6 lg:px-20 pt-6">
          <div className="rounded-2xl border border-[#E6EEF8] bg-white shadow-sm p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-semibold text-[#1E2A3B]">
                Assignment Calendar
              </h2>
              <p className="text-xs text-[#7A8BA1]">
                {classroom?.name} &middot; {events.length} assignment{events.length !== 1 ? "s" : ""} with due dates
              </p>
            </div>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              eventDisplay="block"
              dayMaxEvents={3}
            />
          </div>

          {events.length === 0 && (
            <div className="mt-6 text-center text-sm text-[#94A3B8]">
              No assignments with due dates yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Assignments;

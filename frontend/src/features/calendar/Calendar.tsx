import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassrooms } from "@/services/classroom-service";
import { getPostsByClass } from "@/services/content-service";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { EnrolledClassroom, Post } from "@/shared/types";
import type { EventClickArg } from "@fullcalendar/core";

const COLORS = ["#2563eb", "#16a34a", "#9333ea", "#ea580c", "#e11d48", "#0891b2", "#ca8a04"];

const Calendar = () => {
  const navigate = useNavigate();
  const [filterClassId, setFilterClassId] = useState("all");

  const { data: enrolled = [] } = useQuery<EnrolledClassroom[]>({
    queryKey: ["myClassrooms"],
    queryFn: getClassrooms,
  });

  const classrooms = enrolled.map((e) => e.classroom);

  const postQueries = useQuery({
    queryKey: ["allAssignments", classrooms.map((c) => c.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        classrooms.map(async (c) => {
          const posts: Post[] = await getPostsByClass(c.id);
          return posts
            .filter((p) => p.type === "ASSIGNMENT" && p.dueDate)
            .map((p) => ({ ...p, classroomName: c.name }));
        }),
      );
      return results.flat();
    },
    enabled: classrooms.length > 0,
  });

  const allAssignments = postQueries.data ?? [];

  const events = useMemo(() => {
    const filtered = filterClassId === "all"
      ? allAssignments
      : allAssignments.filter((a) => a.classId === filterClassId);

    const classColorMap = new Map<string, string>();
    classrooms.forEach((c, i) => classColorMap.set(c.id, COLORS[i % COLORS.length]));

    return filtered.map((a) => ({
      id: a.id,
      title: `${a.title} — ${a.classroomName}`,
      date: a.dueDate!,
      color: classColorMap.get(a.classId) ?? "#2563eb",
      extendedProps: { classId: a.classId, postId: a.id },
    }));
  }, [allAssignments, filterClassId, classrooms]);

  const handleEventClick = (info: EventClickArg) => {
    const { classId, postId } = info.event.extendedProps;
    if (classId && postId) navigate(`/c/${classId}/post/${postId}`);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Calendar</h1>
        <Select value={filterClassId} onValueChange={setFilterClassId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classrooms.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        eventClick={handleEventClick}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={3}
      />
    </div>
  );
};

export default Calendar;

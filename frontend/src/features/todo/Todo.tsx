import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassrooms } from "@/services/classroom-service";
import { getPostsByClass } from "@/services/content-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ClipboardList, Calendar, ChevronRight } from "lucide-react";
import type { EnrolledClassroom, Post } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";

type AssignmentItem = Post & { classroomName: string; submitted: boolean };

const Todo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterClassId, setFilterClassId] = useState("all");
  const [tab, setTab] = useState<"Assigned" | "Done">("Assigned");

  const { data: enrolled = [] } = useQuery<EnrolledClassroom[]>({
    queryKey: ["myClassrooms"],
    queryFn: getClassrooms,
  });

  const classrooms = enrolled.map((e) => e.classroom);

  const { data: allAssignments = [], isLoading } = useQuery<AssignmentItem[]>({
    queryKey: ["todoAssignments", classrooms.map((c) => c.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        classrooms.map(async (c) => {
          const posts: Post[] = await getPostsByClass(c.id);
          return posts
            .filter((p) => p.type === "ASSIGNMENT")
            .map((p) => ({
              ...p,
              classroomName: c.name,
              submitted: false,
            }));
        }),
      );
      return results.flat();
    },
    enabled: classrooms.length > 0,
  });

  const filtered = useMemo(() => {
    let list = allAssignments;
    if (filterClassId !== "all") {
      list = list.filter((a) => a.classId === filterClassId);
    }
    if (tab === "Done") {
      return list.filter((a) => a.submitted);
    }
    return list.filter((a) => !a.submitted);
  }, [allAssignments, filterClassId, tab]);

  const grouped = useMemo(() => {
    const overdue: AssignmentItem[] = [];
    const upcoming: AssignmentItem[] = [];
    const noDue: AssignmentItem[] = [];
    const now = new Date();

    for (const a of filtered) {
      if (!a.dueDate) noDue.push(a);
      else if (new Date(a.dueDate) < now) overdue.push(a);
      else upcoming.push(a);
    }

    upcoming.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    overdue.sort((a, b) => new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime());

    return { overdue, upcoming, noDue };
  }, [filtered]);

  const formatDue = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days} days`;
  };

  const renderSection = (title: string, items: AssignmentItem[], color: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mt-6">
        <h2 className="font-bold text-[14px]" style={{ color }}>{title}</h2>
        <div className="mt-2 space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              onClick={() => navigate(`/c/${a.classId}/post/${a.id}`)}
              className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-xl hover:border-[#137FEC]/40 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
            >
              <div className="flex gap-4 items-center">
                <div className="p-3 rounded-md bg-[#E0E7FF] text-[#4F46E5]">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="text-[#0F172A] font-medium">{a.title}</h3>
                  <p className="text-[#64748B] text-[13px]">{a.classroomName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {a.dueDate ? (
                  <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDue(a.dueDate)}</span>
                  </div>
                ) : (
                  <span className="text-[12px] text-[#94A3B8]">No due date</span>
                )}
                {a.maxPoints && (
                  <span className="px-2.5 py-0.5 bg-[#F1F5F9] rounded-full text-[11px] text-[#64748B]">
                    {a.maxPoints} pts
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-250">
      <div className="flex justify-between items-center">
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

        <div
          onClick={() => setTab((p) => (p === "Assigned" ? "Done" : "Assigned"))}
          className="relative flex items-center bg-[#edeef4] rounded-lg p-1 w-fit cursor-pointer hover:shadow-[0_0px_4px_rgba(19,127,236,0.4)]"
        >
          <div
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out"
            style={{
              width: "calc(50% - 4px)",
              transform: tab === "Assigned" ? "translateX(0%)" : "translateX(calc(100% - 2px))",
            }}
          />
          <div
            className={`relative z-10 px-5 py-1 text-center text-sm font-medium select-none transition-colors duration-300 ${tab === "Assigned" ? "text-[#137FEC]" : "text-gray-400"}`}
          >
            Assigned
          </div>
          <div
            className={`relative z-10 px-5 py-1 w-27.5 text-center text-sm font-medium select-none transition-colors duration-300 ${tab === "Done" ? "text-[#137FEC]" : "text-gray-400"}`}
          >
            Done
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mt-10 text-center text-sm text-[#94A3B8]">Loading assignments...</div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="mt-10 text-center text-sm text-[#94A3B8]">
          {tab === "Assigned" ? "No pending assignments" : "No completed assignments"}
        </div>
      )}

      {renderSection("OVERDUE", grouped.overdue, "#ef4444")}
      {renderSection("UPCOMING", grouped.upcoming, "#64748B")}
      {renderSection("NO DUE DATE", grouped.noDue, "#64748B")}
    </div>
  );
};

export default Todo;

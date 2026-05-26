import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMembers } from "@/services/classroom-service";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Check, Users } from "lucide-react";
import type { Member } from "@/shared/types";

interface StudentPickerProps {
  classId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  allStudents: boolean;
  onToggleAll: (all: boolean) => void;
}

const StudentPicker = ({
  classId,
  selectedIds,
  onChange,
  allStudents,
  onToggleAll,
}: StudentPickerProps) => {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["members", classId],
    queryFn: () => getMembers(classId),
    enabled: !!classId,
  });

  const students = (data?.members ?? []).filter((m) => m.role === "MEMBER");

  const trimmed = search.trim().toLowerCase();
  const filtered = trimmed
    ? students.filter((m) => {
        const name = `${m.user?.userName ?? ""} ${m.user?.userLastName ?? ""}`.toLowerCase();
        return name.includes(trimmed) || m.user?.email?.toLowerCase().includes(trimmed);
      })
    : students;

  const toggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const initials = (m: Member) => {
    return `${m.user?.userName?.[0] ?? ""}${m.user?.userLastName?.[0] ?? ""}`.toUpperCase() || "?";
  };

  const fullName = (m: Member) => {
    return `${m.user?.userName ?? ""} ${m.user?.userLastName ?? ""}`.trim() || "Unknown";
  };

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">Assign To</p>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => onToggleAll(true)}
          className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            allStudents
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          All Students
        </button>
        <button
          type="button"
          onClick={() => onToggleAll(false)}
          className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            !allStudents
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
          }`}
        >
          Specific Students
        </button>
      </div>
      {!allStudents && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full px-3 py-2 text-sm border-b border-gray-200 outline-none focus:bg-blue-50/30"
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">No students found</p>
            )}
            {filtered.map((m) => {
              const selected = selectedIds.includes(m.userId);
              return (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => toggle(m.userId)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                    selected ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    selected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-semibold">
                      {initials(m)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-[#334155]">{fullName(m)}</span>
                </button>
              );
            })}
          </div>
          {!allStudents && selectedIds.length > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-[#64748B]">{selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""} selected</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPicker;

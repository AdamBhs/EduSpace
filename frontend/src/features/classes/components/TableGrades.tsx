import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { getGradeTable } from "@/services/content-service";
import { getMembers } from "@/services/classroom-service";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { IoIosSearch } from "react-icons/io";
import { Input } from "@/shared/components/ui/input";
import type { Role, Member } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";

interface Props {
  classId: string;
  classroomName: string;
  userRole: Role;
}

type Assignment = {
  id: string;
  title: string;
  maxPoints: number | null;
  submissions: { id: string; studentId: string; points: number | null; gradedAt: string | null }[];
};

type StudentRow = {
  userId: string;
  name: string;
  initials: string;
  scores: Record<string, { points: number | null; graded: boolean }>;
  totalPoints: number;
  maxPossible: number;
  overallPct: number;
};

const pctToGrade = (pct: number): string => {
  if (pct >= 93) return "A";
  if (pct >= 90) return "A-";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B-";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C-";
  if (pct >= 60) return "D";
  return "F";
};

const TableGrades = ({ classId, classroomName, userRole }: Props) => {
  const { user } = useAuth();
  const isAdmin = userRole === "ADMIN";
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const { data: gradeData, isLoading: gradesLoading } = useQuery<{ assignments: Assignment[]; categories: any[] }>({
    queryKey: ["gradeTable", classId],
    queryFn: () => getGradeTable(classId),
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", classId],
    queryFn: () => getMembers(classId),
    enabled: isAdmin,
  });

  const assignments = gradeData?.assignments ?? [];
  const members: Member[] = membersData?.members ?? [];
  const students = members.filter((m) => m.role === "MEMBER");

  const rows = useMemo<StudentRow[]>(() => {
    if (isAdmin) {
      return students.map((student) => {
        const scores: Record<string, { points: number | null; graded: boolean }> = {};
        let totalPoints = 0;
        let maxPossible = 0;

        for (const a of assignments) {
          const sub = a.submissions.find((s) => s.studentId === student.userId);
          scores[a.id] = {
            points: sub?.points ?? null,
            graded: !!sub?.gradedAt,
          };
          if (sub?.points !== null && sub?.points !== undefined) {
            totalPoints += sub.points;
          }
          if (a.maxPoints) maxPossible += a.maxPoints;
        }

        const name = `${student.user?.userName ?? ""} ${student.user?.userLastName ?? ""}`.trim() || "Unknown";
        const initials = `${student.user?.userName?.[0] ?? ""}${student.user?.userLastName?.[0] ?? ""}`.toUpperCase() || "?";
        const overallPct = maxPossible > 0 ? (totalPoints / maxPossible) * 100 : 0;

        return { userId: student.userId, name, initials, scores, totalPoints, maxPossible, overallPct };
      });
    }

    if (!user) return [];
    const scores: Record<string, { points: number | null; graded: boolean }> = {};
    let totalPoints = 0;
    let maxPossible = 0;

    for (const a of assignments) {
      const sub = a.submissions.find((s) => s.studentId === user.userId);
      scores[a.id] = {
        points: sub?.points ?? null,
        graded: !!sub?.gradedAt,
      };
      if (sub?.points !== null && sub?.points !== undefined) {
        totalPoints += sub.points;
      }
      if (a.maxPoints) maxPossible += a.maxPoints;
    }

    const name = `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim() || "You";
    const initials = `${user.profile?.firstName?.[0] ?? ""}${user.profile?.lastName?.[0] ?? ""}`.toUpperCase() || "?";
    const overallPct = maxPossible > 0 ? (totalPoints / maxPossible) * 100 : 0;

    return [{ userId: user.userId, name, initials, scores, totalPoints, maxPossible, overallPct }];
  }, [assignments, students, isAdmin, user]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, search]);

  const classAvg = useMemo(() => {
    if (rows.length === 0) return 0;
    return rows.reduce((sum, r) => sum + r.overallPct, 0) / rows.length;
  }, [rows]);

  const { completionRate, unmarkedCount } = useMemo(() => {
    let totalSlots = 0;
    let gradedSlots = 0;
    let unmarked = 0;

    for (const r of rows) {
      for (const a of assignments) {
        totalSlots++;
        const s = r.scores[a.id];
        if (s?.graded) gradedSlots++;
        else unmarked++;
      }
    }

    return {
      completionRate: totalSlots > 0 ? (gradedSlots / totalSlots) * 100 : 0,
      unmarkedCount: unmarked,
    };
  }, [rows, assignments]);

  const columns = useMemo<ColumnDef<StudentRow>[]>(() => {
    const cols: ColumnDef<StudentRow>[] = [
      {
        id: "name",
        accessorKey: "name",
        header: "Student Name",
      },
    ];

    for (const a of assignments) {
      cols.push({
        id: a.id,
        header: a.title,
        accessorFn: (row) => row.scores[a.id]?.points ?? null,
      });
    }

    cols.push({
      id: "overall",
      header: "Overall Grade",
      accessorFn: (row) => row.overallPct,
    });

    return cols;
  }, [assignments]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  });

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalRows = table.getPrePaginationRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const exportCsv = () => {
    const header = ["Student", ...assignments.map((a) => a.title), "Overall %", "Grade"];
    const csvRows = [header.join(",")];

    for (const r of rows) {
      const row = [
        `"${r.name}"`,
        ...assignments.map((a) => {
          const s = r.scores[a.id];
          return s?.points !== null && s?.points !== undefined ? `${s.points}/${a.maxPoints ?? "?"}` : "-";
        }),
        r.overallPct.toFixed(1),
        pctToGrade(r.overallPct),
      ];
      csvRows.push(row.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${classroomName.replace(/[^a-zA-Z0-9]/g, "_")}_grades.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (gradesLoading) {
    return (
      <div className="mt-5 px-6 lg:px-20 text-sm text-gray-400">
        Loading grades...
      </div>
    );
  }

  const assignmentCount = assignments.length;
  const gridCols = `240px repeat(${assignmentCount}, 1fr) 160px`;

  return (
    <div className="mt-5 space-y-5 px-6 lg:px-20 overflow-y-auto">
      <div className="rounded-2xl border border-[#E6EEF8] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#E6EEF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#1E2A3B]">
              Course Performance Matrix
            </p>
            <p className="text-xs text-[#7A8BA1]">
              {classroomName} &middot; {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} &middot; {rows.length} student{rows.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-[#E6EEF8] bg-white text-xs font-medium text-[#5A6C84] shadow-sm hover:bg-[#F5F9FF]"
                onClick={() => setShowFilter((p) => !p)}
              >
                Filter Students
              </Button>
            )}
            {isAdmin && (
              <Button
                size="sm"
                className="h-8 rounded-lg bg-[#2B6FF6] text-xs font-semibold text-white shadow-sm hover:bg-[#245FE0]"
                onClick={exportCsv}
              >
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {showFilter && isAdmin && (
          <div className="px-5 py-3 border-b border-[#E6EEF8]">
            <div className="flex items-center max-w-60 border-gray-200 border rounded-md pl-2 focus-within:shadow-[0_0px_4px_rgba(19,127,236,0.4)] transition-shadow duration-200">
              <IoIosSearch size={18} className="text-gray-400" />
              <Input
                className="border-none shadow-none h-8 text-sm"
                type="text"
                placeholder="Filter by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <div style={{ minWidth: `${240 + assignmentCount * 140 + 160}px` }}>
            {/* Header */}
            <div
              className="grid border-b border-[#E6EEF8] bg-[#FAFCFF] px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#7A8BA1]"
              style={{ gridTemplateColumns: gridCols }}
            >
              <span>Student Name</span>
              {assignments.map((a) => (
                <span key={a.id} className="truncate pr-2" title={a.title}>{a.title}</span>
              ))}
              <span className="text-[#2B6FF6]">Overall Grade</span>
            </div>

            {/* Rows */}
            {table.getRowModel().rows.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[#7A8BA1]">
                {assignments.length === 0
                  ? "No assignments created yet"
                  : "No students to display"}
              </div>
            )}

            {table.getRowModel().rows.map((row) => {
              const student = row.original;
              return (
                <div
                  key={row.id}
                  className="grid items-center border-b border-[#E6EEF8] px-5 py-4 text-sm"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  {/* Name cell */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 bg-[#EAF2FF]">
                      <AvatarFallback className="bg-transparent text-[11px] font-semibold text-[#2B6FF6]">
                        {student.initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-[13px] font-semibold text-[#1E2A3B] truncate">
                      {student.name}
                    </p>
                  </div>

                  {/* Assignment score cells */}
                  {assignments.map((a) => {
                    const s = student.scores[a.id];
                    const maxPts = a.maxPoints ?? 100;
                    const hasScore = s?.points !== null && s?.points !== undefined;
                    const pct = hasScore ? (s.points! / maxPts) * 100 : 0;

                    return (
                      <div key={a.id}>
                        <p className="text-[12px] font-semibold text-[#1E2A3B]">
                          {hasScore ? `${s.points}/${maxPts}` : <span className="text-[#7A8BA1]">—</span>}
                        </p>
                        {hasScore && (
                          <div className="mt-2 h-1.5 w-24 rounded-full bg-[#EDF2F8]">
                            <div
                              className={`h-1.5 rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Overall grade cell */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#EAF2FF] text-[11px] font-semibold text-[#2B6FF6] hover:bg-[#EAF2FF]">
                        {student.maxPossible > 0 ? pctToGrade(student.overallPct) : "—"}
                      </Badge>
                      <span className="text-[11px] font-medium text-[#7A8BA1]">
                        ({student.overallPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {totalRows > 0 && (
          <div className="flex flex-col gap-3 px-5 py-3 text-xs text-[#7A8BA1] sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {startRow}-{endRow} of {totalRows} student{totalRows !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2 text-[12px] font-semibold">
              <Button
                variant="outline"
                size="icon-xs"
                className="h-7 w-7 rounded-lg border-[#E6EEF8] text-[#7A8BA1] hover:bg-[#F5F9FF]"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                &#8249;
              </Button>
              <span className="px-2">
                Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                className="h-7 w-7 rounded-lg border-[#E6EEF8] text-[#7A8BA1] hover:bg-[#F5F9FF]"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                &#8250;
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-[#E6EEF8] bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF2FF] text-[#2B6FF6]">
            <span className="text-sm font-semibold">%</span>
          </div>
          <div>
            <p className="text-xs text-[#7A8BA1]">Class Average</p>
            <p className="text-lg font-semibold text-[#1E2A3B]">
              {rows.length > 0 ? `${classAvg.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-[#E6EEF8] bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF8F1] text-[#1DBF73]">
            <span className="text-sm font-semibold">&#8599;</span>
          </div>
          <div>
            <p className="text-xs text-[#7A8BA1]">Completion Rate</p>
            <p className="text-lg font-semibold text-[#1E2A3B]">
              {assignments.length > 0 ? `${completionRate.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-[#E6EEF8] bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3E9] text-[#FF8A3D]">
            <span className="text-sm font-semibold">!</span>
          </div>
          <div>
            <p className="text-xs text-[#7A8BA1]">Unmarked Items</p>
            <p className="text-lg font-semibold text-[#1E2A3B]">
              {unmarkedCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableGrades;

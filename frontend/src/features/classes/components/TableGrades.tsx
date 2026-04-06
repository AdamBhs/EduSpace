import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  type ColumnDef,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";

type Student = {
  initials: string;
  name: string;
  id: string;
  homework: number;
  quiz: number;
  midterm: number;
  overall: string;
  overallPct: number;
};

const TableGrades = () => {
  const data = useMemo<Student[]>(
    () => [
      {
        initials: "AA",
        name: "Alex Anderson",
        id: "ID: 450921",
        homework: 92,
        quiz: 18,
        midterm: 88,
        overall: "A-",
        overallPct: 90.4,
      },
      {
        initials: "BC",
        name: "Bella Chen",
        id: "ID: 450334",
        homework: 78,
        quiz: 14,
        midterm: 82,
        overall: "C+",
        overallPct: 74.2,
      },
      {
        initials: "DM",
        name: "David Miller",
        id: "ID: 450772",
        homework: 98,
        quiz: 20,
        midterm: 96,
        overall: "A+",
        overallPct: 97.6,
      },
      {
        initials: "EG",
        name: "Elena Garcia",
        id: "ID: 450119",
        homework: 85,
        quiz: 17,
        midterm: 81,
        overall: "B",
        overallPct: 83.8,
      },
      {
        initials: "FN",
        name: "Fatima Noor",
        id: "ID: 450553",
        homework: 90,
        quiz: 19,
        midterm: 89,
        overall: "A-",
        overallPct: 89.6,
      },
      {
        initials: "OA",
        name: "Omar Ali",
        id: "ID: 450664",
        homework: 74,
        quiz: 13,
        midterm: 76,
        overall: "C",
        overallPct: 74.0,
      },
      {
        initials: "SK",
        name: "Sara Kim",
        id: "ID: 450775",
        homework: 88,
        quiz: 16,
        midterm: 90,
        overall: "B+",
        overallPct: 87.4,
      },
    ],
    [],
  );

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      { accessorKey: "name", header: "Student Name" },
      { accessorKey: "homework", header: "Homework 1" },
      { accessorKey: "quiz", header: "Quiz 2" },
      { accessorKey: "midterm", header: "Midterm" },
      { accessorKey: "overall", header: "Overall Grade" },
    ],
    [],
  );

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 4,
  });

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalRows = table.getPrePaginationRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    <div className="mt-5 space-y-5 px-6 lg:px-20">
      <div className="rounded-2xl border border-[#E6EEF8] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#E6EEF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#1E2A3B]">
              Course Performance Matrix
            </p>
            <p className="text-xs text-[#7A8BA1]">
              Academic Session 2023-2024 • Term 2
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-[#E6EEF8] bg-white text-xs font-medium text-[#5A6C84] shadow-sm hover:bg-[#F5F9FF]"
            >
              Filter Students
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-[#2B6FF6] text-xs font-semibold text-white shadow-sm hover:bg-[#245FE0]"
            >
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[240px_repeat(3,1fr)_160px] border-b border-[#E6EEF8] bg-[#FAFCFF] px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#7A8BA1]">
              <span>Student Name</span>
              <span>Homework 1</span>
              <span>Quiz 2</span>
              <span>Midterm</span>
              <span className="text-[#2B6FF6]">Overall Grade</span>
            </div>

            {table.getRowModel().rows.map((row) => {
              const student = row.original;
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[240px_repeat(3,1fr)_160px] items-center border-b border-[#E6EEF8] px-5 py-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 bg-[#EAF2FF]">
                      <AvatarFallback className="bg-transparent text-[11px] font-semibold text-[#2B6FF6]">
                        {student.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1E2A3B]">
                        {student.name}
                      </p>
                      <p className="text-[11px] text-[#8FA1B8]">
                        {student.id}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-[#1E2A3B]">
                      {student.homework}/100
                    </p>
                    <div className="mt-2 h-1.5 w-24 rounded-full bg-[#EDF2F8]">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${student.homework}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-[#1E2A3B]">
                      {student.quiz}/20
                    </p>
                    <div className="mt-2 h-1.5 w-24 rounded-full bg-[#EDF2F8]">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${(student.quiz / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-[#1E2A3B]">
                      {student.midterm}/100
                    </p>
                    <div className="mt-2 h-1.5 w-24 rounded-full bg-[#EDF2F8]">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${student.midterm}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#EAF2FF] text-[11px] font-semibold text-[#2B6FF6] hover:bg-[#EAF2FF]">
                        {student.overall}
                      </Badge>
                      <span className="text-[11px] font-medium text-[#7A8BA1]">
                        ({student.overallPct}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-3 text-xs text-[#7A8BA1] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {startRow}-{endRow} of {totalRows} students
          </span>
          <div className="flex items-center gap-2 text-[12px] font-semibold">
            <Button
              variant="outline"
              size="icon-xs"
              className="h-7 w-7 rounded-lg border-[#E6EEF8] text-[#7A8BA1] hover:bg-[#F5F9FF]"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              ‹
            </Button>
            <span className="px-2">
              Page {pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              className="h-7 w-7 rounded-lg border-[#E6EEF8] text-[#7A8BA1] hover:bg-[#F5F9FF]"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              ›
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-[#E6EEF8] bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF2FF] text-[#2B6FF6]">
            <span className="text-sm font-semibold">%</span>
          </div>
          <div>
            <p className="text-xs text-[#7A8BA1]">Class Average</p>
            <p className="text-lg font-semibold text-[#1E2A3B]">86.4%</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-[#E6EEF8] bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF8F1] text-[#1DBF73]">
            <span className="text-sm font-semibold">↗</span>
          </div>
          <div>
            <p className="text-xs text-[#7A8BA1]">Completion Rate</p>
            <p className="text-lg font-semibold text-[#1E2A3B]">94.2%</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-[#E6EEF8] bg-white px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3E9] text-[#FF8A3D]">
            <span className="text-sm font-semibold">!</span>
          </div>
          <div>
            <p className="text-xs text-[#7A8BA1]">Unmarked Items</p>
            <p className="text-lg font-semibold text-[#1E2A3B]">12</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableGrades;

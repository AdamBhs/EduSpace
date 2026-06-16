import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Archive } from "lucide-react";
import Card from "./components/card";
import ClassActionButton from "./components/ClassActionButton";
import { getClassrooms } from "@/services/classroom-service";
import type { EnrolledClassroom } from "@/shared/types";
import NoClassroomFound from "./components/NoClassroomFound";

const Home = () => {
  const { data, isLoading, error } = useQuery<EnrolledClassroom[]>({
    queryKey: ["classrooms"],
    queryFn: getClassrooms,
  });
  const [showArchived, setShowArchived] = useState(false);

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (error) return <p>Error loading classrooms</p>;

  const active = data?.filter((c) => !c.classroom.archived) ?? [];
  const archived = data?.filter((c) => c.classroom.archived) ?? [];

  return (
    <>
      {(data?.length ?? 0) === 0 ? (
        <NoClassroomFound />
      ) : (
        <>
          {active.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {active.map((c) => (
                <Card key={c.classroom.id} data={c} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748B]">No active classrooms.</p>
          )}

          {archived.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                {showArchived ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Archive className="w-4 h-4" />
                Archived ({archived.length})
              </button>
              {showArchived && (
                <div className="mt-4 flex flex-wrap gap-4 opacity-80">
                  {archived.map((c) => (
                    <Card key={c.classroom.id} data={c} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      <ClassActionButton />
    </>
  );
};

export default Home;

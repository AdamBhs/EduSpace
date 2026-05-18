import NavLinksClass from "../components/NavLinksClass";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassroomById } from "@/services/classroom-service";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import TableGrades from "../components/TableGrades";
import type { Classroom } from "@/shared/types";

const Grades = () => {
  const { classId } = useParams<{ classId: string }>();

  const {
    data: classroom,
    isLoading: classLoading,
    error: classError,
  } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  if (classLoading) return <PeopleSkeleton />;
  if (classError) return <p>Error loading data</p>;

  if (classroom?.type === "FRIENDLY") {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Grades are not available in friendly classrooms
      </div>
    );
  }

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col pb-4">
        <NavLinksClass
          classId={classId!}
          activeTab="Grades"
          classroomType={classroom!.type}
          userRole={classroom!.userRole!}
          chatEnabled={classroom!.chatEnabled}
        />
        <TableGrades />
      </section>
    </div>
  );
};

export default Grades;

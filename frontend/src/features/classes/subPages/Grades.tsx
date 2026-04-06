import NavLinksClass from "../components/NavLinksClass";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassroomById } from "@/services/classroom-service";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import TableGrades from "../components/TableGrades";

const Grades = () => {
  const { classId } = useParams<{ classId: string }>();
  const user = JSON.parse(localStorage.getItem("user")!); // Return Object

  const {
    data: classroom,
    isLoading: classLoading,
    error: classError,
  } = useQuery({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  //   TODO: Change the Skeleton loading
  if (classLoading) return <PeopleSkeleton />;
  if (classError) return <p>Error loading data</p>;

  const isTeacher = user.userId === classroom.teacher_id;

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col  pb-4">
        <NavLinksClass
          isTeacher={isTeacher}
          classId={classId!}
          activeTab="Grades"
        />
        <TableGrades />
      </section>
    </div>
  );
};

export default Grades;

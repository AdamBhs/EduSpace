import NavLinksClass from "../components/NavLinksClass";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClassroomById } from "@/services/classroom-service";
import PeopleSkeleton from "../ui/PeopleSkeleton";

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
    <div>
      <NavLinksClass
        isTeacher={isTeacher}
        classId={classId!}
        activeTab="Grades"
      />
      <div>
        
      </div>
    </div>
  );
};

export default Grades;

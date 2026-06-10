import { useQuery } from "@tanstack/react-query";
import Card from "./components/card";
import ClassActionButton from "./components/ClassActionButton";
import ActiveStatus from "./components/ActiveStatus";
import { getClassrooms } from "@/services/classroom-service";
import type { EnrolledClassroom } from "@/shared/types";
import NoClassroomFound from "./components/NoClassroomFound";

const Home = () => {
  const { data, isLoading, error } = useQuery<EnrolledClassroom[]>({
    queryKey: ["classrooms"],
    queryFn: getClassrooms,
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (error) return <p>Error loading classrooms</p>;

  return (
    <>
      <ActiveStatus />
      {data?.length === 0 ? (
        <NoClassroomFound />
      ) : (
        <div className="flex flex-wrap gap-4">
          {data?.map((c) => (
            <Card key={c.classroom.id} data={c} />
          ))}
        </div>
      )}
      <ClassActionButton />
    </>
  );
};

export default Home;

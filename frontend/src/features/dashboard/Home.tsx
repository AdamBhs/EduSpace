import { useQuery } from "@tanstack/react-query";
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

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (error) return <p>Error...</p>;

  console.log("Classrooms data:", data);

  return (
    <>
      {data?.length === 0 ? (
        <NoClassroomFound />
      ) : (
        <div className="flex flex-wrap gap-4">
          {data?.map((c: EnrolledClassroom, index) => (
            <Card key={index} data={c} />
          ))}
        </div>
      )}
      {/* Adding classroom or join classroom */}
      <ClassActionButton />
    </>
  );
};

export default Home;

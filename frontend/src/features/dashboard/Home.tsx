import { useQuery } from "@tanstack/react-query";
import Card from "./components/card";
import { getClassrooms } from "@/services/classroom-service";
import type { Classroom } from "@/shared/types";
import { createContext } from "react";

const Home = () => {
  const { data, isLoading, error } = useQuery<Classroom[]>({
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
        <p>No classrooms found.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {data?.map((c: Classroom) => (
            <Card key={c.classId} data={c} />
          ))}
        </div>
      )}
    </>
  );
};

export default Home;

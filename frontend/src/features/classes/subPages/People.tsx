import { getPeopleEnrolled } from "@/services/classroom-service";
import { useQuery } from "@tanstack/react-query";
import { IoMdPersonAdd } from "react-icons/io";
import { useLocation } from "react-router-dom";
import PeopleCard from "../components/PeopleCard";

const People = () => {
  const location = useLocation();
  const codeClassroom = location.state.classroomCode;

  const { data, isLoading, error } = useQuery<any[]>({
    queryKey: ["classrooms"],
    queryFn: () => getPeopleEnrolled(codeClassroom),
  });
  console.log(data);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) return <p>Error...</p>;

  return (
    <div className="px-68 pt-9">
      <div className="flex justify-between w-full">
        <h1 className="text-2xl text-[#1E293B] font-semibold">People</h1>

        <div
          className="flex items-center gap-2 bg-[#137FEC] text-white rounded-[50px] hover:opacity-90 cursor-pointer px-6 py-2"
          style={{ boxShadow: "0 0px 8px rgba(19, 127, 236, 0.5)" }}
        >
          <IoMdPersonAdd />
          Add People
        </div>
      </div>
      <div className="mt-6">
        <h1 className="text-xl text-[#137FEC] font-semibold border-b border-[#137FEC]/30 pb-2">
          Teachers
        </h1>
        <div>
          {data?.map((user) => {
            return user.role === "teacher" ? <PeopleCard user={user} /> : <></>;
          })}
        </div>
      </div>
    </div>
  );
};

export default People;

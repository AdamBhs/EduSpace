import { getPeopleEnrolled } from "@/services/classroom-service";
import { useQuery } from "@tanstack/react-query";
import { IoMdPersonAdd } from "react-icons/io";
import { useLocation } from "react-router-dom";
import PeopleCard from "../components/PeopleCard";
import SearchInput from "../components/SearchInput";
import { SelectMenu } from "../../../shared/components/SelectMenu";
import PeopleSkeleton from "../ui/PeopleSkeleton";

const People = () => {
  const location = useLocation();
  const codeClassroom = location.state.classroomCode;

  const { data, isLoading, error } = useQuery<any[]>({
    queryKey: ["peopleList", codeClassroom],
    queryFn: () => getPeopleEnrolled(codeClassroom),
  });

  if (isLoading) {
    return <PeopleSkeleton />;
  }

  if (error) return <p>Error...</p>;

  const teachers = data?.filter((user) => user.role === "teacher") ?? [];
  const students = data?.filter((user) => user.role === "student") ?? [];

  return (
    <div className="px-68 pt-9 ">
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

      {/* Teachers Section */}
      <div className="mt-6">
        <h1 className="text-xl text-[#137FEC] font-semibold border-b border-[#137FEC]/30 pb-2">
          Teachers
        </h1>
        <div>
          {teachers.length > 0
            ? teachers.map((user) => (
                <PeopleCard user={user} key={user.userId} />
              ))
            : ""}
        </div>
      </div>

      {/* Students Section */}
      <div className="mt-10">
        <h1 className="text-xl text-[#137FEC] font-semibold border-b border-[#137FEC]/30 pb-2">
          Students
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({students.length})
          </span>
        </h1>
        <div className="flex justify-between items-center">
          <SearchInput />

          <div className="flex items-center w-70 gap-2 justify-end">
            <h3 className="text-[14px] text-[#94A3B8]">SORT BY:</h3>
            <SelectMenu
              placeholder="Select a method"
              label="Sort by"
              data={["LastName", "firstName"]}
            />
          </div>
        </div>

        <div className="bg-[#f9f9f9] mt-6 mb-4 rounded-lg border-[#d6dce4] border">
          {students.length > 0 ? (
            students.map((user, index) => (
              <>
                <PeopleCard
                  user={user}
                  key={user.userId}
                  isLast={index === students.length - 1}
                />
              </>
            ))
          ) : (
            <p className="text-gray-400 text-sm mt-3">No students found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default People;

import {
  getClassroomById,
  getPeopleEnrolled,
} from "@/services/classroom-service";
import { useQuery } from "@tanstack/react-query";
import { IoMdPersonAdd } from "react-icons/io";
import { useParams } from "react-router-dom";
import PeopleCard from "../components/PeopleCard";
import SearchInput from "../components/SearchInput";
import { SelectMenu } from "../../../shared/components/SelectMenu";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import NavLinksClass from "../components/NavLinksClass";

const People = () => {
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

  const {
    data: peopleData,
    isLoading: peopleLoading,
    error: peopleError,
  } = useQuery({
    queryKey: ["peopleList", classroom?.class_code],
    queryFn: () => getPeopleEnrolled(classroom!.class_code),
    enabled: !!classroom?.class_code,
  });

  if (classLoading || peopleLoading) return <PeopleSkeleton />;
  if (classError || peopleError) return <p>Error loading data</p>;

  const teachers = peopleData?.filter((u: any) => u.role === "teacher") ?? [];
  const students = peopleData?.filter((u: any) => u.role === "student") ?? [];

  const isTeacher = user.userId === classroom.teacher_id;
  return (
    <>
      <NavLinksClass
        isTeacher={isTeacher}
        classId={classId!}
        activeTab="People"
      />
      <div className="px-68 pt-9 ">
        <div className="flex justify-between w-full">
          <h1 className="text-2xl text-[#1E293B] font-semibold">People</h1>
          {isTeacher ?? (
            <div
              className="flex items-center gap-2 bg-[#137FEC] text-white rounded-[50px] hover:opacity-90 cursor-pointer px-6 py-2"
              style={{ boxShadow: "0 0px 8px rgba(19, 127, 236, 0.5)" }}
            >
              <IoMdPersonAdd />
              Add People
            </div>
          )}
        </div>

        {/* Teachers Section */}
        <div className="mt-6">
          <h1 className="text-xl text-[#137FEC] font-semibold border-b border-[#137FEC]/30 pb-2">
            Teachers
          </h1>
          <div>
            {teachers.length > 0
              ? teachers.map((user: any) => (
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
              students.map((user: any, index: any) => (
                <PeopleCard
                  user={user}
                  key={user.userId}
                  isLast={index === students.length - 1}
                />
              ))
            ) : (
              <p className="text-gray-400 text-sm my-3 mx-2">
                No students found.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default People;

import NavLinksClass from "../components/NavLinksClass";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import { getClassroomById } from "@/services/classroom-service";
import { IoMdExpand } from "react-icons/io";
const Stream = () => {
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

  if (classLoading) return <PeopleSkeleton />;
  if (classError) return <p>Error loading data</p>;

  console.log(classroom);
  const isTeacher = user.userId === classroom.teacher_id;
  return (
    <>
      <NavLinksClass
        isTeacher={isTeacher}
        classId={classId!}
        activeTab="Stream"
      />
      <div className="pt-6 px-60 flex flex-col">
        <div className="flex flex-col text-white justify-end h-64 rounded-3xl px-8 py-8 bg-linear-to-r from-[#000000]/70 to-[#000000]/20">
          <h1 className="font-bold text-4xl">Frontend</h1>
          <p>Section A • 2024-2025</p>
        </div>
        <div className="flex  mt-6">
          <div className="w-63.5">
            <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg">
              <h4 className="font-bold text-[14px] ">Upcoming Work</h4>
              <div>
                <p className="text-[#64748B] text-[12px]">
                  Due Friday, 11:59 PM
                </p>
                <h3 className="text-[14px]">Lab Report #4: Mitochondria</h3>
              </div>
              <div>
                <p className="text-[#64748B] text-[12px]">
                  Due Friday, 11:59 PM
                </p>
                <h3 className="text-[14px]">Lab Report #4: Mitochondria</h3>
              </div>
              <p className="text-[#137FEC] text-[12px] rounded-full hover:bg-[#137FEC]/10 w-max cursor-pointer px-3 py-2 justify-end">
                View all
              </p>
            </div>
            <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg mt-4">
              <h4 className="font-bold text-[14px] ">Class Code</h4>
              <div className="flex justify-between items-center">
                <h2 className="text-[#137FEC] font-medium text-[18px]">
                  xsa7zee8
                </h2>
                <div className="flex justify-center items-center w-8 h-8 cursor-pointer rounded-full hover:bg-[#94A3B8]/10">
                  <IoMdExpand className="text-[#94A3B8] " />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Stream;

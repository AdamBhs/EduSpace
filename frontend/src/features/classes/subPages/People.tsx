import {
  getClassroomById,
  getMembers,
} from "@/services/classroom-service";
import { useQuery } from "@tanstack/react-query";
import { IoMdPersonAdd } from "react-icons/io";
import { useParams } from "react-router-dom";
import PeopleCard from "../components/PeopleCard";
import SearchInput from "../components/SearchInput";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import NavLinksClass from "../components/NavLinksClass";
import type { Classroom, Member } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";

const People = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();

  const {
    data: classroom,
    isLoading: classLoading,
    error: classError,
  } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ["members", classId],
    queryFn: () => getMembers(classId!),
    enabled: !!classId,
  });

  if (classLoading || membersLoading) return <PeopleSkeleton />;
  if (classError || membersError) return <p>Error loading data</p>;

  const members = membersData?.members ?? [];
  const classroomType = membersData?.classroomType ?? classroom?.type ?? "TEACHING";
  const isTeaching = classroomType === "TEACHING";

  const admins = members.filter((m: Member) => m.role === "ADMIN");
  const regularMembers = members.filter((m: Member) => m.role === "MEMBER");

  const isAdmin = classroom?.userRole === "ADMIN";

  const adminLabel = isTeaching ? "Teachers" : "Admins";
  const memberLabel = isTeaching ? "Students" : "Members";

  return (
    <>
      <NavLinksClass
        classId={classId!}
        activeTab="People"
        classroomType={classroom!.type}
        userRole={classroom!.userRole!}
        chatEnabled={classroom!.chatEnabled}
      />
      <div className="px-68 pt-9">
        <div className="flex justify-between w-full">
          <h1 className="text-2xl text-[#1E293B] font-semibold">People</h1>
          {isAdmin && (
            <div
              className="flex items-center gap-2 bg-[#137FEC] text-white rounded-[50px] hover:opacity-90 cursor-pointer px-6 py-2"
              style={{ boxShadow: "0 0px 8px rgba(19, 127, 236, 0.5)" }}
            >
              <IoMdPersonAdd />
              Add People
            </div>
          )}
        </div>

        {/* Admins/Teachers Section */}
        <div className="mt-6">
          <h1 className="text-xl text-[#137FEC] font-semibold border-b border-[#137FEC]/30 pb-2">
            {adminLabel}
          </h1>
          <div>
            {admins.map((member: Member) => (
              <PeopleCard
                key={member.id}
                user={{
                  userId: member.userId,
                  userName: member.user?.userName ?? "",
                  userLastName: member.user?.userLastName ?? "",
                  profilePic: member.user?.profilePic ?? null,
                  role: member.role,
                }}
                isCreator={member.isCreator}
              />
            ))}
          </div>
        </div>

        {/* Members/Students Section */}
        <div className="mt-10">
          <h1 className="text-xl text-[#137FEC] font-semibold border-b border-[#137FEC]/30 pb-2">
            {memberLabel}
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({regularMembers.length})
            </span>
          </h1>
          <div className="flex justify-between items-center">
            <SearchInput />
          </div>

          <div className="bg-[#f9f9f9] mt-6 mb-4 rounded-lg border-[#d6dce4] border">
            {regularMembers.length > 0 ? (
              regularMembers.map((member: Member, index: number) => (
                <PeopleCard
                  key={member.id}
                  user={{
                    userId: member.userId,
                    userName: member.user?.userName ?? "",
                    userLastName: member.user?.userLastName ?? "",
                    profilePic: member.user?.profilePic ?? null,
                    role: member.role,
                  }}
                  isLast={index === regularMembers.length - 1}
                />
              ))
            ) : (
              <p className="text-gray-400 text-sm my-3 mx-2">
                No {memberLabel.toLowerCase()} found.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default People;

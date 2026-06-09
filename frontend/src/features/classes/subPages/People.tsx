import { useState } from "react";
import {
  getClassroomById,
  getMembers,
  updateMemberRole,
  removeMember,
} from "@/services/classroom-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoMdPersonAdd } from "react-icons/io";
import { IoIosSearch } from "react-icons/io";
import { useParams, useNavigate } from "react-router-dom";
import PeopleCard from "../components/PeopleCard";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import NavLinksClass from "../components/NavLinksClass";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import type { Classroom, Member } from "@/shared/types";
import { useAuth } from "@/context/AuthContext";
import { createConversation } from "@/services/dm-service";

const People = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

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

  const remove = useMutation({
    mutationFn: (memberId: string) => removeMember(classId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", classId] });
      queryClient.invalidateQueries({ queryKey: ["classroom", classId] });
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "ADMIN" | "MEMBER" }) =>
      updateMemberRole(classId!, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", classId] });
    },
  });

  if (classLoading || membersLoading) return <PeopleSkeleton />;
  if (classError || membersError) return <p>Error loading data</p>;

  const members = membersData?.members ?? [];
  const classroomType = membersData?.classroomType ?? classroom?.type ?? "TEACHING";
  const isTeaching = classroomType === "TEACHING";
  const isAdmin = classroom?.userRole === "ADMIN";

  const handleMessage = async (userId: string) => {
    const conv = await createConversation(userId);
    navigate(`/messages/${conv.id}`);
  };

  const adminLabel = isTeaching ? "Teachers" : "Admins";
  const memberLabel = isTeaching ? "Students" : "Members";

  const filterMembers = (list: Member[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((m) => {
      const name = `${m.user?.userName ?? ""} ${m.user?.userLastName ?? ""}`.toLowerCase();
      return name.includes(q);
    });
  };

  const admins = filterMembers(members.filter((m: Member) => m.role === "ADMIN"));
  const regularMembers = filterMembers(members.filter((m: Member) => m.role === "MEMBER"));

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
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 bg-[#137FEC] text-white rounded-[50px] hover:opacity-90 cursor-pointer px-6 py-2"
              style={{ boxShadow: "0 0px 8px rgba(19, 127, 236, 0.5)" }}
            >
              <IoMdPersonAdd />
              Add People
            </div>
          )}
        </div>

        {/* Add People Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[420px]" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Add People</DialogTitle>
              <DialogDescription>
                Share the class code with others to join this classroom.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center justify-center rounded-lg border bg-[#F8FAFC] w-full py-6">
                <span className="text-4xl font-semibold tracking-widest text-[#137FEC]">
                  {classroom?.classCode}
                </span>
              </div>
              <p className="text-sm text-[#64748B] text-center">
                Students can join by entering this code on the home page.
              </p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(classroom?.classCode ?? "");
                }}
                variant="outline"
                className="w-full"
              >
                Copy Class Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className="flex items-center max-w-60 border-gray-200 border rounded-md pl-2 mt-6 focus-within:shadow-[0_0px_4px_rgba(19,127,236,0.4)] transition-shadow duration-200">
          <IoIosSearch size={22} className="text-gray-400" />
          <Input
            className="border-none shadow-none"
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                  email: member.user?.email,
                  userName: member.user?.userName ?? "",
                  userLastName: member.user?.userLastName ?? "",
                  avatarUrl: member.user?.avatarUrl ?? null,
                  role: member.role,
                }}
                isCreator={member.isCreator}
                viewerIsAdmin={isAdmin}
                viewerUserId={user?.userId}
                classroomType={classroomType}
                onDemote={() => changeRole.mutate({ memberId: member.id, role: "MEMBER" })}
                onRemove={() => remove.mutate(member.id)}
                onMessage={() => handleMessage(member.userId)}
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

          <div className="bg-[#f9f9f9] mt-6 mb-4 rounded-lg border-[#d6dce4] border">
            {regularMembers.length > 0 ? (
              regularMembers.map((member: Member, index: number) => (
                <PeopleCard
                  key={member.id}
                  user={{
                    userId: member.userId,
                    email: member.user?.email,
                    userName: member.user?.userName ?? "",
                    userLastName: member.user?.userLastName ?? "",
                    avatarUrl: member.user?.avatarUrl ?? null,
                    role: member.role,
                  }}
                  isLast={index === regularMembers.length - 1}
                  viewerIsAdmin={isAdmin}
                  viewerUserId={user?.userId}
                  classroomType={classroomType}
                  onPromote={() => changeRole.mutate({ memberId: member.id, role: "ADMIN" })}
                  onRemove={() => remove.mutate(member.id)}
                  onMessage={() => handleMessage(member.userId)}
                />
              ))
            ) : (
              <p className="text-gray-400 text-sm my-3 mx-2">
                {search.trim()
                  ? `No ${memberLabel.toLowerCase()} matching "${search}".`
                  : `No ${memberLabel.toLowerCase()} found.`}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default People;

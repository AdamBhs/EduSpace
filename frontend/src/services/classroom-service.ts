import { api } from "./axios";
import type {
  Classroom,
  ClassroomType,
  EnrolledClassroom,
  Member,
  Chapter,
} from "@/shared/types";

// ─── Classrooms ─────────────────────────────────────────────

export const getClassrooms = async (): Promise<EnrolledClassroom[]> => {
  const response = await api.get("/classroom/api/classroom/my");
  return response.data.data;
};

export const getClassroomById = async (classId: string): Promise<Classroom> => {
  const response = await api.get(`/classroom/api/classroom/${classId}`);
  return response.data.data;
};

export const createClassroom = async (data: {
  name: string;
  type: ClassroomType;
  description?: string;
  subject?: string;
  section?: string;
  chatEnabled?: boolean;
}) => {
  const response = await api.post("/classroom/api/classroom/create", data);
  return response.data.data;
};

export const joinClassroom = async (classCode: string) => {
  const response = await api.post("/classroom/api/classroom/join", { classCode });
  return response.data.data;
};

export const updateClassroom = async (
  classId: string,
  data: {
    name?: string;
    description?: string;
    subject?: string;
    section?: string;
    chatEnabled?: boolean;
    coverImage?: string;
  },
) => {
  const response = await api.put(`/classroom/api/classroom/${classId}`, data);
  return response.data.data;
};

export const deleteClassroomById = async (classId: string) => {
  const response = await api.delete(`/classroom/api/classroom/${classId}`);
  return response.data;
};

export const leaveClassroom = async (classId: string) => {
  const response = await api.post(`/classroom/api/classroom/${classId}/leave`);
  return response.data;
};

// ─── Members ────────────────────────────────────────────────

export const getMembers = async (
  classId: string,
): Promise<{ members: Member[]; classroomType: ClassroomType }> => {
  const response = await api.get(`/classroom/api/classroom/${classId}/members`);
  return response.data.data;
};

export const updateMemberRole = async (
  classId: string,
  memberId: string,
  role: "ADMIN" | "MEMBER",
) => {
  const response = await api.put(
    `/classroom/api/classroom/${classId}/members/${memberId}/role`,
    { role },
  );
  return response.data.data;
};

export const removeMember = async (classId: string, memberId: string) => {
  const response = await api.delete(
    `/classroom/api/classroom/${classId}/members/${memberId}`,
  );
  return response.data;
};

// ─── Chapters ───────────────────────────────────────────────

export const getChapters = async (classId: string): Promise<Chapter[]> => {
  const response = await api.get(
    `/classroom/api/classroom/${classId}/chapters`,
  );
  return response.data.data;
};

export const createChapter = async (classId: string, name: string) => {
  const response = await api.post(
    `/classroom/api/classroom/${classId}/chapters`,
    { name },
  );
  return response.data.data;
};

export const updateChapter = async (
  classId: string,
  chapterId: string,
  name: string,
) => {
  const response = await api.put(
    `/classroom/api/classroom/${classId}/chapters/${chapterId}`,
    { name },
  );
  return response.data.data;
};

export const deleteChapter = async (classId: string, chapterId: string) => {
  const response = await api.delete(
    `/classroom/api/classroom/${classId}/chapters/${chapterId}`,
  );
  return response.data;
};

export const reorderChapters = async (
  classId: string,
  chapterIds: string[],
) => {
  const response = await api.put(
    `/classroom/api/classroom/${classId}/chapters/reorder`,
    { chapterIds },
  );
  return response.data;
};

export const getDeletionImpact = async (): Promise<{
  transferable: { id: string; name: string }[];
  deletable: { id: string; name: string }[];
}> => {
  const response = await api.get(
    "/classroom/api/classroom/my/deletion-impact",
  );
  return response.data.data;
};

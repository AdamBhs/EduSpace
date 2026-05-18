import { api } from "./axios";
import type { PostType, StudyMaterialType } from "@/shared/types";

// ─── Posts ──────────────────────────────────────────────────

export const createPost = async (data: {
  classId: string;
  chapterId: string;
  title: string;
  content?: string;
  type: PostType;
  studyMaterialType?: StudyMaterialType;
  dueDate?: string;
  maxPoints?: number;
  attachments?: { fileKey: string; fileName: string; fileSize: number; mimeType: string }[];
}) => {
  const response = await api.post("/content/api/posts", data);
  return response.data.data;
};

export const getPostsByClass = async (
  classId: string,
  params?: {
    type?: PostType;
    studyMaterialType?: StudyMaterialType;
    chapterId?: string;
    sortBy?: string;
    sortOrder?: string;
  },
) => {
  const response = await api.get(`/content/api/posts/class/${classId}`, {
    params,
  });
  return response.data.data;
};

export const getPostById = async (postId: string) => {
  const response = await api.get(`/content/api/posts/${postId}`);
  return response.data.data;
};

export const updatePost = async (
  postId: string,
  data: {
    title?: string;
    content?: string;
    chapterId?: string;
    dueDate?: string;
    maxPoints?: number;
  },
) => {
  const response = await api.put(`/content/api/posts/${postId}`, data);
  return response.data.data;
};

export const deletePost = async (postId: string) => {
  const response = await api.delete(`/content/api/posts/${postId}`);
  return response.data;
};

// ─── Comments ───────────────────────────────────────────────

export const getComments = async (postId: string) => {
  const response = await api.get(`/content/api/comments/post/${postId}`);
  return response.data.data;
};

export const createComment = async (postId: string, content: string) => {
  const response = await api.post("/content/api/comments", { postId, content });
  return response.data.data;
};

export const deleteComment = async (commentId: string) => {
  const response = await api.delete(`/content/api/comments/${commentId}`);
  return response.data;
};

// ─── Submissions ────────────────────────────────────────────

export const submitAssignment = async (data: {
  postId: string;
  content?: string;
  attachments?: { fileKey: string; fileName: string; fileSize: number; mimeType: string }[];
}) => {
  const response = await api.post("/content/api/submissions", data);
  return response.data.data;
};

export const getSubmissions = async (postId: string) => {
  const response = await api.get(`/content/api/submissions/post/${postId}`);
  return response.data.data;
};

export const gradeSubmission = async (
  submissionId: string,
  data: { points: number; feedback?: string },
) => {
  const response = await api.put(
    `/content/api/submissions/${submissionId}/grade`,
    data,
  );
  return response.data.data;
};

// ─── Grades ─────────────────────────────────────────────────

export const getGradeTable = async (classId: string) => {
  const response = await api.get(`/content/api/grades/${classId}/table`);
  return response.data.data;
};

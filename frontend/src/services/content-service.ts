import { api } from "./axios";

// Content API
export const healthContent = async () => {
  const response = await api.get("/content/"); // NGINX -> /api/content -> 3004
  return response.data;
};

export const createPost = async (data: {
  classId: string;
  title: string;
  content: string;
  type?: string;
}) => {
  const response = await api.post("/content/api/posts", data);
  return response.data;
};

export const createPostByClass = async (data: {
  classId: string;
  authorId: string;
  title: string;
  content: string;
  attachments?: string[];
  type?: string;
}) => {
  const response = await api.post("/content/api/posts", {
    class_id: data.classId,
    author_id: data.authorId,
    title: data.title,
    content: data.content,
    attachments: data.attachments || [],
    type: data.type || "ANNOUNCEMENT",
  });
  return response.data;
};

export const getAllPostByClass = async (classId: string) => {
  const response = await api.get(`/content/api/posts?class_id=${classId}`);
  return response.data;
};
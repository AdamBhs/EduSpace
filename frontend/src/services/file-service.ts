import { api } from "./axios";

export const uploadFile = async (file: File, entityId?: string, entityType?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (entityId) formData.append("entityId", entityId);
  if (entityType) formData.append("entityType", entityType);

  const response = await api.post("/files/api/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const uploadMultipleFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await api.post("/files/api/files/upload-multiple", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const getFileUrl = async (fileKey: string): Promise<string> => {
  const response = await api.get(`/files/api/files/url/${encodeURIComponent(fileKey)}`);
  return response.data.data.url;
};

export const deleteFile = async (fileKey: string) => {
  const response = await api.delete(`/files/api/files/${encodeURIComponent(fileKey)}`);
  return response.data;
};

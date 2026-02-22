import { api } from "./axios";

// Files API
export const uploadFile = async (fileData: any) => {
  const response = await api.post("/files/upload", fileData); // NGINX -> /api/files -> 3010
  return response.data;
};

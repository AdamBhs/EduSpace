import { api } from "./axios";

// Files API
export const uploadFile = async (fileData: any) => {
  const formData = new FormData();
  formData.append("file", fileData);
  
  const response = await api.post("/files/upload", formData); // NGINX -> /api/files -> 3010
  return response.data;
};

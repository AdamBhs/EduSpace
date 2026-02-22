import { api } from "./axios";

// Classroom API
export const getClassrooms = async () => {
  const response = await api.get("/classroom"); // NGINX -> /api/classroom -> 3003
  return response.data;
};

import { api } from "./axios";

// Classroom API
export const getClassrooms = async () => {
  const response = await api.get("/classroom/api/classroom/getClassrooms"); // NGINX -> /api/classroom -> 3003
  return response.data.data;
};

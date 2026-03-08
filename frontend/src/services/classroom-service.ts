import { api } from "./axios";

// Classroom API
export const getClassrooms = async () => {
  const response = await api.get("/classroom/api/classroom/getClassrooms"); // NGINX -> /api/classroom -> 3003
  return response.data.data;
};

export const getPeopleEnrolled = async (classCode: any) => {
  const response = await api.post("/classroom/api/classroom/getPeople", {
    classCode,
  });

  return response.data.data.data;
};

import { api } from "./axios";

// Classroom API
export const getClassrooms = async () => {
  const response = await api.get("/classroom/api/classroom/getClassrooms"); // NGINX -> /api/classroom -> 3003
  return response.data.data;
};

export const getPeopleEnrolled = async (classCode: string) => {
  const response = await api.post("/classroom/api/classroom/getPeople", {
    classCode,
  });

  return response.data.data.data;
};

export const getClassroomById = async (classId: string) => {
  const response = await api.get(`/classroom/api/classroom/${classId}`);
  return response.data.data;
};

export const joinClassroom = async (classCode: string) => {
  const response = await api.post("/classroom/api/classroom/join", {
    class_code: classCode,
  });
  return response.data;
};

export const createClassroom = async (data: {
  name: string;
  section?: string;
  subject?: string;
  description?: string;
  chapter?: string;
}) => {
  const response = await api.post("/classroom/api/classroom/create", data);
  return response.data;
};

export const deleteClassroomById = async (id: string) => {
  const response = await api.delete(`/classroom/api/classroom/${id}`);
  return response
}

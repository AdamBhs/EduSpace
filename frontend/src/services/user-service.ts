import { api } from "./axios";

// Users API
export const getUsers = async () => {
  const response = await api.get("/users"); // this hits NGINX -> /api/users -> 3002
  return response.data;
};

export const register = async (userData: any) => {
  try {
    const response = await api.post("/users/api/auth/register", userData);
    console.log("Registration successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Registration error:", error.response?.data || error.message);
    throw error;
  }
};

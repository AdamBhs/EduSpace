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

export const login = async (userData: any) => {
  try {
    const response = await api.post("/users/api/auth/login", userData);

    return response.data;
  } catch (error: any) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

export const verifyCode = async (data: any) => {
  try {
    const response = await api.post("/users/api/auth/verifyCode", data);
    console.log("Veirfy code sucessfuly");
    return response;
  } catch (error: any) {
    console.error("Verify code error:", error.response?.data || error.message);
    throw error;
  }
};

export const resendCode = async (email: string) => {
  const response = await api.post("/users/api/auth/resendCode", { email });
  return response.data;
};

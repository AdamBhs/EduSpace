import { api } from "./axios";
import type { AuthUser } from "@/shared/types";

export const register = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}) => {
  const response = await api.post("/users/api/auth/register", userData);
  return response.data;
};

export const login = async (credentials: {
  email: string;
  password: string;
}, rememberMe = false): Promise<{ token: string; user: AuthUser }> => {
  const response = await api.post("/users/api/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });
  const { token, user } = response.data.data;
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem("token", token);
  storage.setItem("user", JSON.stringify(user));
  return { token, user };
};

export const verifyCode = async (data: { email: string; code: string }) => {
  const response = await api.post("/users/api/auth/verifyCode", data);
  return response.data;
};

export const resendCode = async (email: string) => {
  const response = await api.post("/users/api/auth/resendCode", { email });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/users/api/user/me");
  return response.data.data;
};

export const updateProfile = async (data: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  timezone?: string;
}) => {
  const response = await api.put("/users/api/user/me", data);
  return response.data.data;
};

export const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await api.put("/users/api/user/upload_avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const getUsers = async (userIds: string[]): Promise<import("@/shared/types").UserSummary[]> => {
  const response = await api.post("/users/api/user/getUsers", { userIds });
  return response.data.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post("/users/api/auth/request-reset", { email });
  return response.data;
};

export const resetPassword = async (resetToken: string, newPassword: string) => {
  const response = await api.post("/users/api/auth/reset-password", {
    resetToken,
    newPassword,
  });
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.post("/users/api/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const deleteAccount = async (classroomAction: "delete" | "transfer" = "delete") => {
  const response = await api.delete("/users/api/user/me", {
    data: { classroomAction },
  });
  return response.data;
};

import { z } from "zod";

export const createClassroomSchema = z.object({
  name: z.string().min(2, "Classroom name is required"),
});

export const validationCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phoneNumber: z.string().optional(),
  timezone: z.string().optional(),
  isVerified: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const updateEmailSchema = z.object({
  body: z.object({
    newEmail: z
      .string()
      .email("Invalid email address")
      .min(1, "Email is required"),
  }),
});

export const batchUsersSchema = z.object({
  body: z.object({
    userIds: z
      .array(z.string().uuid("Invalid user ID format"))
      .min(1, "At least one user ID is required")
      .max(100, "Maximum 100 user IDs allowed"),
  }),
});

export type updateEmailInput = z.infer<typeof updateEmailSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;
export type batchUsersInput = z.infer<typeof batchUsersSchema>;

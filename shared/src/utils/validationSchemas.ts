import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────

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
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const validationCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

export const resendCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ─── User ────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  timezone: z.string().optional(),
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

export const batchUsersSchema = z.object({
  userIds: z
    .array(z.string().uuid("Invalid user ID format"))
    .min(1, "At least one user ID is required")
    .max(100, "Maximum 100 user IDs allowed"),
});

// ─── Classroom ───────────────────────────────────────────────

export const createClassroomSchema = z.object({
  name: z.string().min(2, "Classroom name is required"),
  type: z.enum(["TEACHING", "FRIENDLY"]),
  description: z.string().optional(),
  subject: z.string().optional(),
  section: z.string().optional(),
  chatEnabled: z.boolean().default(true),
});

export const updateClassroomSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  section: z.string().optional(),
  chatEnabled: z.boolean().optional(),
  coverImage: z.string().optional(),
});

export const joinClassroomSchema = z.object({
  classCode: z.string().length(6, "Class code must be 6 characters"),
});

// ─── Chapters ────────────────────────────────────────────────

export const createChapterSchema = z.object({
  name: z.string().min(1, "Chapter name is required"),
});

export const updateChapterSchema = z.object({
  name: z.string().min(1, "Chapter name is required"),
});

export const reorderChaptersSchema = z.object({
  chapterIds: z.array(z.string().uuid()).min(1, "At least one chapter ID required"),
});

// ─── Posts ────────────────────────────────────────────────────

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1)).min(2, "At least 2 options required").max(6),
  correctIndex: z.number().int().min(0),
  points: z.number().int().min(1, "Points must be at least 1"),
});

const quizDataSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1, "At least one question is required"),
});

const questionDataSchema = z.object({
  answerType: z.enum(["multiple_choice", "text"]),
  question: z.object({
    id: z.string().min(1),
    text: z.string().min(1, "Question text is required"),
    options: z.array(z.string().min(1)).min(2).max(6).optional(),
    correctIndex: z.number().int().min(0).optional(),
    points: z.number().int().min(1, "Points must be at least 1"),
  }),
});

export const createPostSchema = z.object({
  classId: z.string().uuid(),
  chapterId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  type: z.enum(["STUDY_MATERIAL", "QUIZ", "QUESTION", "ASSIGNMENT", "ANNOUNCEMENT"]),
  studyMaterialType: z.enum(["COURS", "TD", "TP", "RESUME"]).optional(),
  quizData: quizDataSchema.optional(),
  questionData: questionDataSchema.optional(),
  dueDate: z.string().datetime({ local: true }).optional(),
  maxPoints: z.number().min(1, "Max points must be at least 1").optional(),
  attachments: z
    .array(
      z.object({
        fileKey: z.string(),
        fileName: z.string(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
      })
    )
    .optional(),
}).refine(
  (data) => data.type !== "ASSIGNMENT" || (data.maxPoints !== undefined && data.maxPoints !== null),
  { message: "Max points is required for assignments", path: ["maxPoints"] },
).refine(
  (data) => data.type !== "QUIZ" || (data.quizData !== undefined && data.quizData !== null),
  { message: "Quiz data is required for quiz posts", path: ["quizData"] },
).refine(
  (data) => {
    if (data.type !== "QUIZ" || !data.quizData) return true;
    return data.quizData.questions.every(q => q.correctIndex < q.options.length);
  },
  { message: "correctIndex must be within options range", path: ["quizData"] },
).refine(
  (data) => data.type !== "QUESTION" || (data.questionData !== undefined && data.questionData !== null),
  { message: "Question data is required for question posts", path: ["questionData"] },
).refine(
  (data) => {
    if (data.type !== "QUESTION" || !data.questionData) return true;
    const q = data.questionData;
    if (q.answerType === "multiple_choice") {
      return q.question.options && q.question.options.length >= 2
        && q.question.correctIndex !== undefined
        && q.question.correctIndex < q.question.options.length;
    }
    return true;
  },
  { message: "Multiple choice questions require options and a valid correctIndex", path: ["questionData"] },
);

export const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  chapterId: z.string().uuid().optional(),
  quizData: quizDataSchema.optional(),
  questionData: questionDataSchema.optional(),
  dueDate: z.string().datetime({ local: true }).optional(),
  maxPoints: z.number().min(0).optional(),
});

// ─── Comments ────────────────────────────────────────────────

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1, "Comment cannot be empty"),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

// ─── Submissions ─────────────────────────────────────────────

export const createSubmissionSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().optional(),
  attachments: z
    .array(
      z.object({
        fileKey: z.string(),
        fileName: z.string(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
      })
    )
    .optional(),
});

export const gradeSubmissionSchema = z.object({
  points: z.number().min(0),
  feedback: z.string().optional(),
});

// ─── Type exports ────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;

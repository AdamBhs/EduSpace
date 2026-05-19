// ─── Enums ──────────────────────────────────────────────────

export type ClassroomType = "TEACHING" | "FRIENDLY";
export type Role = "ADMIN" | "MEMBER";
export type PostType = "STUDY_MATERIAL" | "QUIZ" | "QUESTION" | "ASSIGNMENT" | "ANNOUNCEMENT";
export type StudyMaterialType = "COURS" | "TD" | "TP" | "RESUME";

// ─── Auth ───────────────────────────────────────────────────

export type UserProfile = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phoneNumber?: string | null;
  timezone?: string;
};

export type AuthUser = {
  userId: string;
  email: string;
  profile: UserProfile | null;
};

export type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export type PropsChildrenReact = {
  children: React.ReactNode;
};

// ─── User Summary (from batch lookup) ───────────────────────

export type UserSummary = {
  userId: string;
  userName: string | null;
  userLastName: string | null;
  profilePic: string | null;
};

// ─── Classroom ──────────────────────────────────────────────

export type Classroom = {
  id: string;
  name: string;
  type: ClassroomType;
  classCode: string;
  description: string | null;
  subject: string | null;
  section: string | null;
  coverImage: string | null;
  chatEnabled: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number };
  chapters?: Chapter[];
  userRole?: Role;
};

export type EnrolledClassroom = {
  classroom: Classroom;
  role: Role;
  creator: UserSummary | null;
};

// ─── Member ─────────────────────────────────────────────────

export type Member = {
  id: string;
  classId: string;
  userId: string;
  role: Role;
  joinedAt: string;
  user: UserSummary | null;
  isCreator: boolean;
};

// ─── Chapter ────────────────────────────────────────────────

export type Chapter = {
  id: string;
  classId: string;
  name: string;
  position: number;
  createdAt: string;
};

// ─── Post ───────────────────────────────────────────────────

export type Attachment = {
  id: string;
  postId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url?: string;
};

export type Post = {
  id: string;
  classId: string;
  chapterId: string;
  authorId: string;
  title: string;
  content: string | null;
  type: PostType;
  studyMaterialType: StudyMaterialType | null;
  dueDate: string | null;
  maxPoints: number | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  _count?: { comments: number; submissions: number };
};

// ─── Comment ────────────────────────────────────────────────

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Submission ─────────────────────────────────────────────

export type Submission = {
  id: string;
  postId: string;
  studentId: string;
  content: string | null;
  points: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  attachments?: SubmissionAttachment[];
};

export type SubmissionAttachment = {
  id: string;
  submissionId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url?: string;
};

// ─── Notification ───────────────────────────────────────────

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  classId: string | null;
  postId: string | null;
  isRead: boolean;
  createdAt: string;
};

// ─── Chat ───────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string | null;
  fileKey: string | null;
  fileName: string | null;
  createdAt: string;
  classId?: string;
};

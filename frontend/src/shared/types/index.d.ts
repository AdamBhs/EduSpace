export type PropsChildrenReact = {
  children: React.ReactNode;
};

export type AuthContextType = {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
};

export type Teacher = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type Classroom = {
  classId: string;
  name: string;
  teacher_id: string;
  class_code: string;
  description: string;
  subject: string;
  section: string;
  chapter: string;
  material_categories: any[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type EnrolledClassroom = {
  teacher: Teacher;
  classroom: Classroom;
};

export type UserType = {
  userId: string;
  userName: string;
  userLastName: string;
  profilePic: string;
  role: string;
};

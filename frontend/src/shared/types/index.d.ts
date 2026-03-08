export type PropsChildrenReact = {
  children: React.ReactNode;
};

export type AuthContextType = {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
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
  material_categories: any[]; // or a more specific type if you know the shape
  is_archived: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
};

export type UserType = {
  userId: string;
  userName: string;
  userLastName: string;
  profilePic: string;
  role: string;
};

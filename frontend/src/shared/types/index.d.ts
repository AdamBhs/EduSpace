export type PropsChildrenReact = {
  children: React.ReactNode;
};

export type AuthContextType = {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
};

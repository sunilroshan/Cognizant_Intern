import React, { createContext, useState, useEffect, useContext } from "react";
import { setToken, getToken, clearAuth, setRole, getRole, setUserInfo, getUserInfo } from "./utils/auth";
import { User } from "./models/users";

interface AuthContextType {
  token: string | null;
  role: string | null;
  user: User | null;
  login: (token: string, role: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [role, setRoleState] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getToken();
    const storedRole = getRole();
    const storedUser = getUserInfo();

    if (storedToken && storedRole) {
      setTokenState(storedToken);
      setRoleState(storedRole);
      setUserState(storedUser);
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newRole: string, newUser: User) => {
    setToken(newToken);
    setRole(newRole);
    setUserInfo(newUser);

    setTokenState(newToken);
    setRoleState(newRole);
    setUserState(newUser);
  };

  const logout = () => {
    clearAuth();
    setTokenState(null);
    setRoleState(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

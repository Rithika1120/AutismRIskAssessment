import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { authApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>; // ✅ NEW: re-fetches user from backend
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user + token from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("autism_assessment_user");
    const token = localStorage.getItem("auth_token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  // ✅ NEW: Refresh user from backend (call after redeeming invite code)
  const refreshUser = async (): Promise<void> => {
    try {
      const res = await authApi.getCurrentUser();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem("autism_assessment_user", JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await authApi.login({ email, password, role });

      if (!res.success || !res.data) {
        setIsLoading(false);
        return false;
      }

      const token =
        (res.data as any)?.token ||
        (res.data as any)?.access_token ||
        (res.data as any)?.data?.token ||
        (res.data as any)?.data?.access_token;

      const loggedUser =
        (res.data as any)?.user ||
        (res.data as any)?.data?.user;

      if (!token || !loggedUser) {
        console.error("Login response missing token/user:", res.data);
        setIsLoading(false);
        return false;
      }

      localStorage.setItem("auth_token", token);
      localStorage.setItem("autism_assessment_user", JSON.stringify(loggedUser));

      setUser(loggedUser);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await authApi.register({ email, password, name, role });

      if (!res.success || !res.data) {
        setIsLoading(false);
        return false;
      }

      const token =
        (res.data as any)?.token ||
        (res.data as any)?.access_token ||
        (res.data as any)?.data?.token ||
        (res.data as any)?.data?.access_token;

      const newUser =
        (res.data as any)?.user ||
        (res.data as any)?.data?.user;

      if (!token || !newUser) {
        console.error("Register response missing token/user:", res.data);
        setIsLoading(false);
        return false;
      }

      localStorage.setItem("auth_token", token);
      localStorage.setItem("autism_assessment_user", JSON.stringify(newUser));

      setUser(newUser);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Register error:", err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("autism_assessment_user");
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
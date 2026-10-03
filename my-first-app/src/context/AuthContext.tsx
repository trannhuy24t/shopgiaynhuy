import { useState, type ReactNode } from "react";
import { login as loginApi } from "../api/auth";
import { getApiErrorMessage } from "../api/client";
import { AuthContext, type LoginResult } from "./AuthContextValue";
import type { AuthUser } from "../types/auth";

export { AuthContext };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setLoading(true);

      const res = await loginApi({
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem("refreshToken", res.data.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);

      return {
        success: true,
        user: res.data.user,
        message: res.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, "Đăng nhập thất bại!"),
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "Admin";

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated, isAdmin, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

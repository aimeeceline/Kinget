import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, register as apiRegister, me as apiMe } from "../services/authClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    const j = localStorage.getItem("user");
    return j ? JSON.parse(j) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const login = useCallback(async (email, password) => {
    setLoading(true); setError("");
    try {
      const { token, user } = await apiLogin(email, password);
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user); setToken(token);
      return user;
    } catch (e) {
      setError(e.code === "INVALID_CREDENTIALS" ? "Email hoặc mật khẩu không đúng" : "Đăng nhập thất bại");
      throw e;
    } finally { setLoading(false); }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true); setError("");
    try {
      return await apiRegister(payload);
    } catch (e) {
      setError(e.code === "EMAIL_TAKEN" ? "Email đã được sử dụng" : "Đăng ký thất bại");
      throw e;
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null); setToken(null);
  }, []);

  // Nếu có token mà user chưa có (F5), thử khôi phục
  useEffect(() => {
    let alive = true;
    if (token && !user) {
      apiMe(token).then(u => { if (alive) setUser(u); });
    }
    return () => { alive = false; };
  }, [token, user]);

  const isAuthenticated = !!token && !!user;
  const value = useMemo(() => ({ user, token, isAuthenticated, loading, error, login, register, logout }),
    [user, token, isAuthenticated, loading, error, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}

// web/src/hooks/useAuth.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as authService from "../services/authClient";

// hook “thật”
function useAuthInner() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // load lại từ localStorage khi F5
  useEffect(() => {
    if (!user) {
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch {
          // bỏ qua
        }
      }
    }
  }, [user]);

  const login = useCallback(async (phone, password) => {
    setLoading(true);
    setError("");
    try {
      const { user } = await authService.login(phone, password);
      // 🔥 đây là chỗ bé đã có rồi
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true);
    setError("");
    try {
      const res = await authService.register(data);
      return res;
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout,
  };
}

// ----------------------
// 🟣 Context
// ----------------------
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthInner();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // nếu component chưa được bọc bởi AuthProvider
    throw new Error("useAuthContext must be used inside <AuthProvider />");
  }
  return ctx;
}

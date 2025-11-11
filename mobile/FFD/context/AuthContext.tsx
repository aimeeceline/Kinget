import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit,
} from "firebase/firestore";
import { db } from "../data/FireBase";

// ==============================
// 🔹 Interface người dùng
// ==============================
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role?: "user" | "restaurant" | "admin";
  avatar?: string;
  isActive?: boolean;

  // 🏪 Dành cho restaurant
  restaurantName?: string;
  branchId?: string;
  branchName?: string;
  branchAddress?: string;
  status?: string;
}
type LoginResult = { ok: boolean; msg?: string };
// ==============================
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  guestMode: boolean;
  setGuestMode: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => Promise<void>;
  // one-field login: phone OR email + password
login: (identifier: string, password: string) => Promise<LoginResult>;
  restoreUser: () => Promise<void>;
  refreshUserFromServer: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// ==============================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestMode, setGuestMode] = useState(false);

  // --------------------------------------------
  // helpers
  const sanitize = (s: string) => s?.trim();

  const buildUser = async (docId: string, data: any): Promise<User> => {
    let branchData: any = null;

    if (data.role === "restaurant" && data.branchId) {
      try {
        const branchSnap = await getDoc(doc(db, "branches", data.branchId));
        if (branchSnap.exists()) branchData = branchSnap.data();
      } catch (e) {
        console.warn("⚠️ Không lấy được thông tin chi nhánh:", e);
      }
    }

    const u: User = {
      id: docId,
      email: data.email || "",
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      phone: data.phone || "",
      role: data.role || "user",
      avatar: data.avatar || "",
      isActive: data.isActive ?? true,
      restaurantName: data.restaurantName || "",
      branchId: data.branchId || "",
      branchName: branchData?.name || "",
      branchAddress: branchData?.address || "",
      status: data.status || "",
    };
    return u;
  };

  // =====================================================
  // 🔐 LOGIN: số điện thoại HOẶC email + password
  // =====================================================
 // ====================== 🔐 LOGIN ======================
const login = async (identifier: string, password: string): Promise<LoginResult> => {
  try {
    // thử theo phone trước
    let snap = await getDocs(
      query(
        collection(db, "users"),
        where("phone", "==", identifier),
        where("password", "==", password)
      )
    );

    // nếu không có -> thử theo email
    if (snap.empty) {
      snap = await getDocs(
        query(
          collection(db, "users"),
          where("email", "==", identifier),
          where("password", "==", password)
        )
      );
    }

    if (snap.empty) {
      return { ok: false, msg: "Sai thông tin đăng nhập!" };
    }

    const userDoc = snap.docs[0];
    const data = userDoc.data() as any;

    // nếu là restaurant thì lấy thông tin chi nhánh theo branchId
    let branchData: any = null;
    if (data.role === "restaurant" && data.branchId) {
      const bSnap = await getDoc(doc(db, "branches", data.branchId));
      if (bSnap.exists()) branchData = bSnap.data();
    }

    const userData: User = {
      id: userDoc.id,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      phone: data.phone || "",
      email: data.email || "",
      role: data.role || "user",
      avatar: data.avatar || "",
      branchId: data.branchId || "",
      restaurantName: branchData?.name || data.restaurantName || "",
      branchAddress: branchData?.address || "",
      status: data.status || "approved",
    };

    setUser(userData);
    await AsyncStorage.setItem("FFD_USER", JSON.stringify(userData));

    return { ok: true };
  } catch (e) {
    console.error("🔥 Lỗi login:", e);
    return { ok: false, msg: "Không thể đăng nhập. Vui lòng thử lại!" };
  }
};



  // =====================================================
  // ♻️ Khôi phục user từ AsyncStorage khi mở app lại
  // =====================================================
  const restoreUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("FFD_USER");
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        console.log("🔄 Đã khôi phục user:", parsedUser.role);
      }
    } catch (err) {
      console.error("Lỗi khôi phục user:", err);
    }
  };

  // =====================================================
  // 🔁 Làm mới hồ sơ user từ server (khi đổi chi nhánh, đổi tên…)
  // =====================================================
  const refreshUserFromServer = async () => {
    try {
      if (!user?.id) return;
      const snap = await getDocs(
        query(collection(db, "users"), where("__name__", "==", user.id), limit(1))
      );
      if (snap.empty) return;
      const data = snap.docs[0].data();
      const fresh = await buildUser(user.id, data);
      setUser(fresh);
      await AsyncStorage.setItem("FFD_USER", JSON.stringify(fresh));
    } catch (e) {
      console.error("Không thể refresh user:", e);
    }
  };

  // =====================================================
  // 🚪 Logout
  // =====================================================
  const logout = async () => {
    setUser(null);
    setGuestMode(false);
    await AsyncStorage.removeItem("FFD_USER");
    console.log("👋 Đã đăng xuất");
  };

  useEffect(() => {
    restoreUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        guestMode,
        setGuestMode,
        logout,
        login,
        restoreUser,
        refreshUserFromServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==============================
// ✅ Custom hook
// ==============================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
};

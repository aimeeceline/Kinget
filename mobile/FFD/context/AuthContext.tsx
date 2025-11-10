import React, { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id: string; // Firestore document ID
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role?: "user" | "restaurant"| "admin";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  guestMode: boolean;
  setGuestMode: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestMode, setGuestMode] = useState(false);

  const logout = () => {
    setUser(null);
    setGuestMode(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, guestMode, setGuestMode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
};

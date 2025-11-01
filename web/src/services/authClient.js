// web/src/services/authClient.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@shared/FireBase"; // alias của bé đã khai trong vite.config.js

// 🟢 ĐĂNG NHẬP BẰNG SĐT + MẬT KHẨU
export async function login(phone, password) {
  const q = query(
    collection(db, "users"),
    where("phone", "==", phone),
    where("password", "==", password)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Số điện thoại hoặc mật khẩu không đúng");
  }

  const user = { id: snap.docs[0].id, ...snap.docs[0].data() };

  const token = `token-${user.id}-${Date.now()}`;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  return { token, user };
}

// 🟢 ĐĂNG KÝ
export async function register({ firstName, lastName, email, password, phone }) {
  // check trùng email hoặc trùng phone cũng được
  const q = query(collection(db, "users"), where("phone", "==", phone));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error("Số điện thoại đã được sử dụng");
  }

  const docRef = await addDoc(collection(db, "users"), {
    firstName: firstName || "",
    lastName: lastName || "",
    email: email || "",
    password,
    phone,
    role: "user",
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id };
}

// 🟢 LẤY THÔNG TIN USER ĐANG LƯU
export async function me() {
  const userStr = localStorage.getItem("user");
  if (!userStr) throw new Error("Chưa đăng nhập");
  return JSON.parse(userStr);
}

// 🟢 ĐĂNG XUẤT
export async function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

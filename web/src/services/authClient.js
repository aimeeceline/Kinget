// web/src/services/authClient.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@shared/FireBase";

// 🟢 ĐĂNG NHẬP: email trước, không có thì thử phone
export async function login(identifier, password) {
  // thử theo email
  let q = query(
    collection(db, "users"),
    where("email", "==", identifier),
    where("password", "==", password)
  );

  let snap = await getDocs(q);

  // nếu không có email khớp thì thử phone
  if (snap.empty) {
    q = query(
      collection(db, "users"),
      where("phone", "==", identifier),
      where("password", "==", password)
    );
    snap = await getDocs(q);
  }

  if (snap.empty) {
    throw new Error("Tài khoản hoặc mật khẩu không đúng");
  }

  const user = { id: snap.docs[0].id, ...snap.docs[0].data() };

  // chặn tài khoản bị khóa
  if (user.isActive === false) {
    throw new Error("Tài khoản đã bị khóa. Liên hệ quản trị viên.");
  }

  const token = `token-${user.id}-${Date.now()}`;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  return { token, user };
}

// 🟢 ĐĂNG KÝ USER THƯỜNG
export async function register({ firstName, lastName, email, password, phone }) {
  // check trùng email
  if (email) {
    const qEmail = query(collection(db, "users"), where("email", "==", email));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      throw new Error("Email đã được sử dụng");
    }
  }

  // check trùng phone (nếu có nhập)
  if (phone) {
    const qPhone = query(collection(db, "users"), where("phone", "==", phone));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      throw new Error("Số điện thoại đã được sử dụng");
    }
  }

  const docRef = await addDoc(collection(db, "users"), {
    firstName: firstName || "",
    lastName: lastName || "",
    email: email || "",
    password,
    phone: phone || "",
    role: "user",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id };
}

// 🟢 LẤY USER TỪ LOCAL
export async function me() {
  const userStr = localStorage.getItem("user");
  if (!userStr) throw new Error("Chưa đăng nhập");
  return JSON.parse(userStr);
}

// 🟢 ĐĂNG XUẤT
export async function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

// ===============================
// 🔥 Firebase config cho toàn app
// ===============================
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyC1bGfFwoCdsjJ6GsvO4F7loFqzDdjd4FE",
  authDomain: "fastfood-delivery-5f17c.firebaseapp.com",
  projectId: "fastfood-delivery-5f17c",
  storageBucket: "fastfood-delivery-5f17c.firebasestorage.app",
  messagingSenderId: "507323974003",
  appId: "1:507323974003:web:41dba8a364210922460506",
  measurementId: "G-P8D12NNMRN",
};

// ✅ Khởi tạo app & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };

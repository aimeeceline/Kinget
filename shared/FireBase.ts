// ===============================
// 🔥 Firebase config cho toàn app
// ===============================
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyD3Sr4YBa21Tb0hxRxybW-aYRSzZSEBubk",
  authDomain: "kinget-2b062.firebaseapp.com",
  projectId: "kinget-2b062",
  storageBucket: "kinget-2b062.firebasestorage.app",
  messagingSenderId: "805860525117",
  appId: "1:805860525117:web:a68b85efe8b359b564d654",
  measurementId: "G-10JZRP2KQM"
};

// ✅ Khởi tạo app & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };

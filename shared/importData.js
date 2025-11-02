// ===============================
// 🚀 Import dữ liệu vào Firestore (Node 20 ESM)
// ===============================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import foods from "./foods.json" assert { type: "json" }; // ✅ import JSON chuẩn ESM

// ✅ Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC1bGfFwoCdsjJ6GsvO4F7loFqzDdjd4FE",
  authDomain: "fastfood-delivery-5f17c.firebaseapp.com",
  projectId: "fastfood-delivery-5f17c",
  storageBucket: "fastfood-delivery-5f17c.firebasestorage.app",
  messagingSenderId: "507323974003",
  appId: "1:507323974003:web:41dba8a364210922460506",
  measurementId: "G-P8D12NNMRN",
};

// 🔥 Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📦 Import dữ liệu
async function importFoods() {
  console.log(`📦 Bắt đầu import ${foods.length} món...`);
  try {
    for (const food of foods) {
      await addDoc(collection(db, "foods"), food);
      console.log(`✅ Đã thêm: ${food.name}`);
    }
    console.log("🎉 Import hoàn tất!");
  } catch (error) {
    console.error("❌ Lỗi khi import:", error);
  }
}

importFoods();

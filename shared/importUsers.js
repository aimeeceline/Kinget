// importUsers.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// 1. đọc file JSON
const raw = fs.readFileSync("./users.json", "utf-8");
const users = JSON.parse(raw);

// 2. CẤU HÌNH FIREBASE của bạn (giống file importData.js)
const firebaseConfig = {
  apiKey: "AIzaSyD3Sr4YBa21Tb0hxRxybW-aYRSzZSEBubk",
  authDomain: "kinget-2b062.firebaseapp.com",
  projectId: "kinget-2b062",
  storageBucket: "kinget-2b062.firebasestorage.app",
  messagingSenderId: "805860525117",
  appId: "1:805860525117:web:a68b85efe8b359b564d654",
  measurementId: "G-10JZRP2KQM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("📦 Bắt đầu import", users.length, "user...");

  for (const u of users) {
    const { id, ...data } = u;

    await setDoc(doc(db, "users", id), {
      ...data,
      createdAt: new Date()
    });

    console.log("✅ đã thêm user:", id, data.email);
  }

  console.log("🎉 xong!");
}

run().catch(console.error);

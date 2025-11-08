// importData.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// 1. đọc file JSON
const raw = fs.readFileSync("./foods.json", "utf-8");
const foods = JSON.parse(raw);

// 2. CẤU HÌNH FIREBASE của bạn (dán config thật vào đây)
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

function makeId(index) {
  // index = 1 -> F01, 2 -> F02, 10 -> F10
  return `F${String(index).padStart(2, "0")}`;
}

async function run() {
  console.log("📦 Bắt đầu import", foods.length, "món...");

  let i = 1;
  for (const item of foods) {
    const id = makeId(i);

    await setDoc(doc(db, "foods", id), {
      ...item,
      code: id,
      createdAt: new Date(),
    });

    console.log("✅ đã thêm:", id, item.name);
    i++;
  }

  console.log("🎉 xong!");
}

run().catch(console.error);

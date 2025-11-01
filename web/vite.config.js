import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  // 👇 cho Vite biết trước là sẽ dùng firebase
  optimizeDeps: {
    include: ["firebase/app", "firebase/firestore"],
  },
  // 👇 cho phép đọc file ra ngoài thư mục web
  server: {
    fs: {
      allow: [".."], // cho phép truy cập .. = D:\Kinget\shared
    },
  },
});

// src/services/foodService.js
import { db } from "@shared/FireBase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

/**
 * Lấy danh sách id món mà 1 chi nhánh đang bật
 * Đọc từ: branches/{branchId}/branchFoods
 * Ưu tiên field foodId, nếu không có thì dùng doc.id
 */
export const getBranchActiveFoodIds = async (branchId) => {
  const snap = await getDocs(
    collection(db, "branches", branchId, "branchFoods")
  );

  const ids = snap.docs
    .filter((d) => d.data().isActive !== false) // true hoặc undefined thì coi là bật
    .map((d) => d.data().foodId || d.id);

  return ids;
};

/**
 * Lấy tất cả món từ collection "foods"
 */
export const getAllFoods = async () => {
  const snap = await getDocs(collection(db, "foods"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

/**
 * Lấy 1 món theo id
 */
export const getFoodById = async (id) => {
  const ref = doc(db, "foods", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * Lấy món theo category (KHÔNG theo chi nhánh)
 * cat ví dụ: "Pizza", "Burger", "Drink"
 */
export const getFoodsByCategory = async (cat) => {
  const q = query(collection(db, "foods"), where("category", "==", cat));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Lấy món theo category nhưng CHỈ những món chi nhánh đã bật
 */
export const getFoodsByCategoryForBranch = async (branchId, cat) => {
  if (!branchId) {
    throw new Error("branchId is required");
  }

  // 1. lấy list id món chi nhánh đang bán
  const activeIds = await getBranchActiveFoodIds(branchId);
  if (activeIds.length === 0) return [];

  // 2. lấy foods theo category
  const q = query(collection(db, "foods"), where("category", "==", cat));
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 3. filter lại theo danh sách của chi nhánh
  return all.filter((f) => activeIds.includes(f.id));
};

/**
 * Lấy TẤT CẢ món mà 1 chi nhánh đang bật (không quan tâm category)
 */
export const getFoodsForBranch = async (branchId) => {
  if (!branchId) {
    throw new Error("branchId is required");
  }

  // danh sách id món mà chi nhánh có bật
  const activeIds = await getBranchActiveFoodIds(branchId);
  if (activeIds.length === 0) return [];

  // lấy hết foods rồi lọc
  const snap = await getDocs(collection(db, "foods"));
  const allFoods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return allFoods.filter((f) => activeIds.includes(f.id));
};

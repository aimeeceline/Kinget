// src/services/foodService.js
import { db } from "@shared/FireBase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

/**
 * Lấy toàn bộ foods đang ACTIVE (isActive !== false)
 * tiện để tái dùng
 */
const getAllActiveFoodsMap = async () => {
  const snap = await getDocs(collection(db, "foods"));
  const activeMap = new Map();

  snap.docs.forEach((d) => {
    const data = d.data();
    // nếu không có isActive thì xem như active
    if (data.isActive !== false) {
      activeMap.set(d.id, { id: d.id, ...data });
    }
  });

  return activeMap;
};

/**
 * Lấy danh sách id món mà 1 chi nhánh đang bật
 * Đọc từ: branches/{branchId}/branchFoods
 * Nhưng sẽ chỉ giữ lại những món mà foods cũng đang active
 */
export const getBranchActiveFoodIds = async (branchId) => {
  // đọc config của chi nhánh
  const snap = await getDocs(
    collection(db, "branches", branchId, "branchFoods")
  );

  // danh sách id mà chi nhánh "muốn" bán
  const branchFoodIds = snap.docs
    .filter((d) => d.data().isActive !== false) // true hoặc undefined thì coi là bật
    .map((d) => d.data().foodId || d.id);

  if (branchFoodIds.length === 0) return [];

  // đọc toàn bộ foods đang active
  const activeFoodsMap = await getAllActiveFoodsMap();

  // chỉ giữ lại id nào tồn tại trong foods và foods đang active
  const filteredIds = branchFoodIds.filter((id) => activeFoodsMap.has(id));

  return filteredIds;
};

/**
 * Lấy tất cả món từ collection "foods"
 * chỉ trả về món đang active
 */
export const getAllFoods = async () => {
  const snap = await getDocs(collection(db, "foods"));
  return snap.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((f) => f.isActive !== false); // lọc ở đây luôn
};

/**
 * Lấy 1 món theo id
 */
export const getFoodById = async (id) => {
  const ref = doc(db, "foods", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  if (data.isActive === false) {
    // món bị khóa thì trả null luôn
    return null;
  }

  return { id: snap.id, ...data };
};

/**
 * Lấy món theo category (KHÔNG theo chi nhánh)
 * cat ví dụ: "Pizza", "Burger", "Drink"
 * chỉ trả món đang active
 */
export const getFoodsByCategory = async (cat) => {
  const q = query(collection(db, "foods"), where("category", "==", cat));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((f) => f.isActive !== false);
};

/**
 * Lấy món theo category nhưng CHỈ những món chi nhánh đã bật
 * và món gốc trong foods cũng phải đang active
 */
export const getFoodsByCategoryForBranch = async (branchId, cat) => {
  if (!branchId) {
    throw new Error("branchId is required");
  }

  // 1. lấy list id món chi nhánh đang bán (đã lọc bởi foods active)
  const activeIds = await getBranchActiveFoodIds(branchId);
  if (activeIds.length === 0) return [];

  // 2. lấy foods theo category (chỉ active)
  const q = query(collection(db, "foods"), where("category", "==", cat));
  const snap = await getDocs(q);
  const all = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((f) => f.isActive !== false);

  // 3. filter lại theo danh sách của chi nhánh
  return all.filter((f) => activeIds.includes(f.id));
};

/**
 * Lấy TẤT CẢ món mà 1 chi nhánh đang bật (không quan tâm category)
 * nhưng món gốc phải đang active
 */
export const getFoodsForBranch = async (branchId) => {
  if (!branchId) {
    throw new Error("branchId is required");
  }

  // danh sách id món mà chi nhánh có bật (đã lọc bởi foods active)
  const activeIds = await getBranchActiveFoodIds(branchId);
  if (activeIds.length === 0) return [];

  // lấy hết foods đang active
  const activeFoodsMap = await getAllActiveFoodsMap();

  // trả về những món có trong cả 2
  const result = activeIds
    .map((id) => activeFoodsMap.get(id))
    .filter(Boolean);

  return result;
};

export const deleteFoodWithConstraints = async (foodId) => {
  if (!foodId) throw new Error("foodId is required");

  // 1️⃣ Load tất cả orders (hoặc sau này em có thể filter theo status nếu muốn)
  const ordersSnap = await getDocs(collection(db, "orders"));

  let usedInActiveOrder = false;

  ordersSnap.forEach((orderDoc) => {
    const data = orderDoc.data();
    const status = (data.status || "").toUpperCase();

    // Đơn đã hoàn tất / huỷ thì bỏ qua
    const isFinished =
      status === "COMPLETED" || status === "CANCELLED";
    if (isFinished) return;

    const items = Array.isArray(data.items) ? data.items : [];

    // nếu bất kỳ item nào có foodId trùng -> món đang nằm trong đơn đang xử lý
    if (items.some((it) => it.foodId === foodId)) {
      usedInActiveOrder = true;
    }
  });

  if (usedInActiveOrder) {
    throw new Error(
      "Không thể xoá món ăn vì đang có đơn hàng chưa hoàn tất chứa món này."
    );
  }

  // 2️⃣ Không bị ràng buộc -> xoá branchFoods ở mọi chi nhánh + xoá foods
  const branchesSnap = await getDocs(collection(db, "branches"));
  const batch = writeBatch(db);

  branchesSnap.forEach((branchDoc) => {
    const branchId = branchDoc.id;

    const branchFoodRef = doc(
      db,
      "branches",
      branchId,
      "branchFoods",
      foodId
    );
    batch.delete(branchFoodRef); // nếu không tồn tại thì Firestore bỏ qua
  });

  // xoá luôn doc trong foods
  batch.delete(doc(db, "foods", foodId));

  await batch.commit();
};
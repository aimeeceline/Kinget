// src/services/branchService.js
import { db } from "@shared/FireBase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

// Các trạng thái ĐANG XỬ LÝ (không cho xóa chi nhánh)
const ACTIVE_STATUSES = ["processing", "preparing", "shipping"];

/**
 * Tạo chi nhánh mới:
 *  - /branches/{branchId}
 *  - /branches/{branchId}/branchFoods/* sinh từ toàn bộ foods
 *  - /users/{Rxx} account restaurant gắn với chi nhánh
 */
export async function createBranchWithFoodsAndAccount({
  id,
  name,
  address,
  phone,
  lat,
  lng,
}) {
  if (!id) throw new Error("branch id is required");

  const branchId = id.trim();

  // 1️⃣ Tạo document chi nhánh
  const branchRef = doc(db, "branches", branchId);
  await setDoc(branchRef, {
    name: name.trim(),
    address: address.trim(),
    phone: (phone || "").trim(),
    lat,
    lng,
    isActive: true,
    createdAt: serverTimestamp(),
  });

  // 2️⃣ Sinh branchFoods từ toàn bộ foods
  const foodsSnap = await getDocs(collection(db, "foods"));
  const batchFoods = writeBatch(db);

  foodsSnap.forEach((foodDoc) => {
    const foodId = foodDoc.id;
    const foodData = foodDoc.data();

    const branchFoodRef = doc(
      db,
      "branches",
      branchId,
      "branchFoods",
      foodId
    );

    batchFoods.set(branchFoodRef, {
      foodId,
      foodName: foodData.name || "",
      isActive: true,
      stock: 0,
      createdAt: serverTimestamp(),
    });
  });

  await batchFoods.commit();

  // 3️⃣ Tạo luôn account restaurant
const rawNum = parseInt(branchId.substring(1), 10); // "01" → 1, "15" → 15, "101" → 101

let finalPass;
  finalPass = rawNum.toString()*111; 

  const accountId = "R" + branchId.substring(1);
  const email = `${branchId.toLowerCase()}@kinget.com`;
  const password = finalPass; // em muốn đổi thì đổi

  const userRef = doc(db, "users", accountId);
  await setDoc(userRef, {
    email,
    password,
    firstName: accountId,
    lastName: "Kinget",
    phone: finalPass,
    role: "restaurant",
    branchId: branchId,
    isActive: true,
    createdAt: serverTimestamp(),
  });

  return { branchId, accountId, email, password };
}

/**
 * Xoá chi nhánh có ràng buộc:
 *  - KHÔNG cho xoá nếu còn orders branch đó đang ACTIVE
 *  - Nếu ok:
 *      + xoá /branches/{id}/branchFoods/*
 *      + xoá /branches/{id}
 *      + xoá luôn user role="restaurant" có branchId = id
 */
export async function deleteBranchWithConstraints(branchId) {
  if (!branchId) throw new Error("branchId is required");

  // 1️⃣ Check đơn hàng đang xử lý của chi nhánh
  const ordersRef = collection(db, "orders");
  const q = query(
    ordersRef,
    where("branchId", "==", branchId),
    where("status", "in", ACTIVE_STATUSES)
  );
  const activeOrdersSnap = await getDocs(q);

  if (!activeOrdersSnap.empty) {
    throw new Error(
      "Không thể xoá chi nhánh vì còn đơn hàng đang xử lý. Vui lòng xử lý xong tất cả đơn trước."
    );
  }

  const batch = writeBatch(db);

  // 2️⃣ Xoá toàn bộ branchFoods
  const branchFoodsRef = collection(db, "branches", branchId, "branchFoods");
  const branchFoodsSnap = await getDocs(branchFoodsRef);
  branchFoodsSnap.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  // 3️⃣ Xoá chi nhánh
  batch.delete(doc(db, "branches", branchId));

  // 4️⃣ Xoá luôn tài khoản restaurant gắn với chi nhánh
  const usersRef = collection(db, "users");
  const restaurantQ = query(
    usersRef,
    where("branchId", "==", branchId),
    where("role", "==", "restaurant")
  );
  const restaurantSnap = await getDocs(restaurantQ);

  restaurantSnap.forEach((userDoc) => {
    batch.delete(userDoc.ref);
  });

  await batch.commit();
}

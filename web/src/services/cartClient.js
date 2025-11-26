// src/services/cartClient.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  doc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@shared/FireBase";

// ==============================
// 1. Helpers
// ==============================

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value]; // nếu là 1 object đơn
}

// signature KHÔNG chứa branchId (vì đã nằm trong path)
export function buildSignature(food, extra = {}) {
  const size =
    extra.selectedSize?.label ||
    food.selectedSize?.label ||
    "noSize";

  const base =
    extra.selectedBase?.label ||
    food.selectedBase?.label ||
    "noBase";

  const toppings = normalizeArray(
    extra.selectedTopping ?? food.selectedTopping
  );
  const addOns = normalizeArray(
    extra.selectedAddOn ?? food.selectedAddOn
  );

  const toppingPart =
    toppings.length > 0
      ? toppings
          .map((t) => t?.label || "")
          .filter(Boolean)
          .sort()
          .join("+")
      : "noTop";

  const addOnPart =
    addOns.length > 0
      ? addOns
          .map((a) => a?.label || "")
          .filter(Boolean)
          .sort()
          .join("+")
      : "noAdd";

  const notePart =
    (extra.note || food.note || "").trim() || "noNote";

  const baseId = food.id || food.foodId || food.name || "noId";

  return `${baseId}-${size}-${base}-${toppingPart}-${addOnPart}-${notePart}`;
}

// tính giá theo lựa chọn hiện tại
export function calcPrice(food) {
  if (!food) return 0;

  let price = 0;

  if (
    food.selectedSize &&
    typeof food.selectedSize.price === "number"
  ) {
    price += food.selectedSize.price;
  } else if (typeof food.price === "number") {
    price += food.price;
  }

  if (
    food.selectedBase &&
    typeof food.selectedBase.price === "number"
  ) {
    price += food.selectedBase.price;
  }

  const toppings = normalizeArray(
    food.selectedTopping ?? food.selectedToppings
  );
  for (const t of toppings) {
    if (t?.price && typeof t.price === "number") {
      price += t.price;
    }
  }

  const addOns = normalizeArray(
    food.selectedAddOn ?? food.selectedAddOns
  );
  for (const a of addOns) {
    if (a?.price && typeof a.price === "number") {
      price += a.price;
    }
  }

  return price;
}

// ==============================
// 2. Thêm vào giỏ (per-branch)
// ==============================
export async function addToCart(
  userId,
  food,
  {
    selectedSize = null,
    selectedBase = null,
    selectedTopping = null,
    selectedAddOn = null,
    note = "",
    quantity = 1,
    branchId = null,
  } = {}
) {
  if (!userId) throw new Error("NO_USER");
  if (!food) throw new Error("NO_FOOD");

  if (!branchId && typeof window !== "undefined") {
    branchId = localStorage.getItem("selectedBranchId") || null;
  }
  if (!branchId) throw new Error("NO_BRANCH");

  const userStr = String(userId);
  const branchStr = String(branchId);

  const itemsCol = collection(
    db,
    "users",
    userStr,
    "cart",
    branchStr,
    "items"
  );

  const normalizedTopping = normalizeArray(
    selectedTopping ?? food.selectedTopping
  );
  const normalizedAddOn = normalizeArray(
    selectedAddOn ?? food.selectedAddOn
  );

  const signature = buildSignature(food, {
    selectedSize,
    selectedBase,
    selectedTopping: normalizedTopping,
    selectedAddOn: normalizedAddOn,
    note,
  });

  const unitPrice = calcPrice({
    ...food,
    selectedSize,
    selectedBase,
    selectedTopping: normalizedTopping,
    selectedAddOn: normalizedAddOn,
  });

  // tìm món trùng trong branch hiện tại
  const q = query(itemsCol, where("signature", "==", signature));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    const oldQty =
      typeof data.quantity === "number" ? data.quantity : 1;
    const newQty = oldQty + quantity;

    await updateDoc(docSnap.ref, {
      quantity: newQty,
      price: unitPrice,
      updatedAt: serverTimestamp(),
    });

    return { merged: true, id: docSnap.id, branchId: branchStr };
  }

  const baseId = food.id || food.foodId || null;

  const payload = {
    id: baseId,
    foodId: baseId,
    name: food.name,
    image:
      food.image ||
      food.imageUrl ||
      "https://via.placeholder.com/150?text=Food",
    category: food.category || "",
    isActive: true,
    selectedSize,
    selectedBase,
    selectedAddOn: normalizedAddOn,
    selectedTopping: normalizedTopping,
    note,
    quantity,
    price: unitPrice,
    signature,
    branchId: branchStr,
    createdAt: serverTimestamp(),
  };

  const newDoc = await addDoc(itemsCol, payload);
  return { merged: false, id: newDoc.id, branchId: branchStr };
}

// ==============================
// 3. Nghe realtime giỏ (branch hiện tại)
// ==============================
//
// listenCart(userId, callback)
//  - tự lấy branchId từ localStorage
//
export function listenCart(userId, callback) {
  if (!userId) return () => {};

  let branchId = null;
  if (typeof window !== "undefined") {
    branchId = localStorage.getItem("selectedBranchId") || null;
  }
  if (!branchId) {
    // không có chi nhánh thì trả rỗng
    callback([]);
    return () => {};
  }

  const userStr = String(userId);
  const branchStr = String(branchId);

  const itemsCol = collection(
    db,
    "users",
    userStr,
    "cart",
    branchStr,
    "items"
  );

  const unsub = onSnapshot(itemsCol, (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data();
      const qty =
        typeof data.quantity === "number" ? data.quantity : 1;
      const unit =
        typeof data.price === "number"
          ? data.price
          : calcPrice(data);

      return {
        firestoreId: d.id,
        cartDocId: d.id,
        branchId: branchStr,
        ...data,
        quantity: qty,
        _unitPrice: unit,
        _lineTotal: unit * qty,
      };
    });

    callback(items);
  });

  return unsub;
}

// ==============================
// 4. Update / delete (per-branch, lấy branch từ localStorage)
// ==============================
export async function updateCartQty(userId, cartDocId, quantity) {
  if (!userId || !cartDocId) return;

  let branchId = null;
  if (typeof window !== "undefined") {
    branchId = localStorage.getItem("selectedBranchId") || null;
  }
  if (!branchId) return;

  const userStr = String(userId);
  const branchStr = String(branchId);

  const ref = doc(
    db,
    "users",
    userStr,
    "cart",
    branchStr,
    "items",
    String(cartDocId)
  );
  await updateDoc(ref, {
    quantity,
    updatedAt: serverTimestamp(),
  });
}

export async function removeCartItem(userId, cartDocId) {
  if (!userId || !cartDocId) return;

  let branchId = null;
  if (typeof window !== "undefined") {
    branchId = localStorage.getItem("selectedBranchId") || null;
  }
  if (!branchId) return;

  const userStr = String(userId);
  const branchStr = String(branchId);

  const ref = doc(
    db,
    "users",
    userStr,
    "cart",
    branchStr,
    "items",
    String(cartDocId)
  );
  await deleteDoc(ref);
}

// (tuỳ chọn) xoá hết giỏ 1 chi nhánh hiện tại
export async function clearCartBranch(userId) {
  if (!userId) return;

  let branchId = null;
  if (typeof window !== "undefined") {
    branchId = localStorage.getItem("selectedBranchId") || null;
  }
  if (!branchId) return;

  const userStr = String(userId);
  const branchStr = String(branchId);

  const itemsCol = collection(
    db,
    "users",
    userStr,
    "cart",
    branchStr,
    "items"
  );
  const snap = await getDocs(itemsCol);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

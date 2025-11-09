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

// signature có cả branch để không merge chéo chi nhánh
export function buildSignature(food, extra = {}) {
  const sizePart =
    extra.selectedSize?.label ||
    food.selectedSize?.label ||
    "noSize";

  const basePart =
    extra.selectedBase?.label ||
    food.selectedBase?.label ||
    "noBase";

  const toppingPart =
    extra.selectedTopping?.label ||
    food.selectedTopping?.label ||
    "noTop";

  const addOnPart =
    extra.selectedAddOn?.label ||
    food.selectedAddOn?.label ||
    "noAdd";

  const notePart = (extra.note || food.note || "").trim() || "noNote";

  const branchPart = extra.branchId || food.branchId || "noBranch";

  return `${food.id || food.name}-${sizePart}-${basePart}-${toppingPart}-${addOnPart}-${notePart}-${branchPart}`;
}

// tính giá từ lựa chọn hiện tại
export function calcPrice(food) {
  if (!food) return 0;

  let price =
    (food.selectedSize && typeof food.selectedSize.price === "number"
      ? food.selectedSize.price
      : null) ??
    (typeof food.price === "number" ? food.price : null) ??
    0;

  if (food.selectedBase?.price) {
    price += food.selectedBase.price;
  }

  if (Array.isArray(food.selectedToppings)) {
    for (const t of food.selectedToppings) {
      if (t?.price) price += t.price;
    }
  } else if (food.selectedTopping?.price) {
    price += food.selectedTopping.price;
  }

  if (food.selectedAddOn?.price) {
    price += food.selectedAddOn.price;
  }

  return price;
}

// ==============================
// 2. Thêm vào giỏ (bản tối giản)
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

  // lấy chi nhánh từ localStorage nếu không truyền
  if (!branchId && typeof window !== "undefined") {
    branchId = localStorage.getItem("selectedBranchId") || null;
  }

  const cartCol = collection(db, "users", userId, "cart");

  const signature = buildSignature(food, {
    selectedSize,
    selectedBase,
    selectedTopping,
    selectedAddOn,
    note,
    branchId,
  });

  const unitPrice = calcPrice({
    ...food,
    selectedSize,
    selectedBase,
    selectedTopping,
    selectedAddOn,
  });

  // tìm món trùng
  const q = query(cartCol, where("signature", "==", signature));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    const oldQty = typeof data.quantity === "number" ? data.quantity : 1;
    const newQty = oldQty + quantity;

    await updateDoc(docSnap.ref, {
      quantity: newQty,
      price: unitPrice,
      updatedAt: serverTimestamp(),
    });

    return { merged: true, id: docSnap.id };
  }

  // payload gọn
  const payload = {
    foodId: food.id, // để sau này tạo order
    name: food.name,
    image:
      food.image ||
      food.imageUrl ||
      "https://via.placeholder.com/150?text=Food",
    category: food.category || "",
    // chỉ lưu cái user chọn
    selectedSize,
    selectedBase,
    selectedTopping,
    selectedAddOn,
    note,
    quantity,
    price: unitPrice,
    signature,
    branchId: branchId || null,
    createdAt: serverTimestamp(),
  };

  const newDoc = await addDoc(cartCol, payload);
  return { merged: false, id: newDoc.id };
}

// ==============================
// 3. Nghe realtime giỏ
// ==============================
export function listenCart(userId, callback) {
  if (!userId) return () => {};
  const cartCol = collection(db, "users", userId, "cart");
  const unsub = onSnapshot(cartCol, (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data();
      const qty = typeof data.quantity === "number" ? data.quantity : 1;
      const unit =
        typeof data.price === "number" ? data.price : calcPrice(data);
      return {
        cartDocId: d.id,
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
// 4. Update / delete
// ==============================
export async function updateCartQty(userId, cartDocId, quantity) {
  if (!userId || !cartDocId) return;
  const ref = doc(db, "users", userId, "cart", cartDocId);
  await updateDoc(ref, { quantity });
}

export async function removeCartItem(userId, cartDocId) {
  if (!userId || !cartDocId) return;
  const ref = doc(db, "users", userId, "cart", cartDocId);
  await deleteDoc(ref);
}

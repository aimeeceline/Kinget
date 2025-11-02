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

// 👉 giống y app: CartContext.tsx
// `${id}-${size}-${base}-${topping}-${addOn}-${note}`
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

  return `${food.id || food.name}-${sizePart}-${basePart}-${toppingPart}-${addOnPart}-${notePart}`;
}

// 👉 giống app: (size ?? price) + base + topping + addOn
export function calcPrice(food) {
  if (!food) return 0;

  // 1) base = size price | food.selectedSize.price | food.price
  let price =
    (food.selectedSize && typeof food.selectedSize.price === "number"
      ? food.selectedSize.price
      : null) ??
    (typeof food.price === "number" ? food.price : null) ??
    0;

  // 2) base (pizza/burger)
  if (food.selectedBase?.price) {
    price += food.selectedBase.price;
  }

  // 3) topping: có thể mảng hoặc 1 object
  if (Array.isArray(food.selectedToppings)) {
    for (const t of food.selectedToppings) {
      if (t?.price) price += t.price;
    }
  } else if (food.selectedTopping?.price) {
    price += food.selectedTopping.price;
  }

  // 4) addOn
  if (food.selectedAddOn?.price) {
    price += food.selectedAddOn.price;
  }

  return price;
}

// ==============================
// 2. Thêm vào giỏ
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
  } = {}
) {
  if (!userId) throw new Error("NO_USER");
  if (!food) throw new Error("NO_FOOD");

  const cartCol = collection(db, "users", userId, "cart");

  // build món sẽ lưu
  const signature = buildSignature(food, {
    selectedSize,
    selectedBase,
    selectedTopping,
    selectedAddOn,
    note,
  });

  // tính đơn giá đúng app
  const unitPrice = calcPrice({
    ...food,
    selectedSize,
    selectedBase,
    selectedTopping,
    selectedAddOn,
  });

  // tìm xem đã có món trùng signature chưa
  const q = query(cartCol, where("signature", "==", signature));
  const snap = await getDocs(q);

  if (!snap.empty) {
    // đã có → tăng số lượng
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    const oldQty = typeof data.quantity === "number" ? data.quantity : 1;
    const newQty = oldQty + quantity;

    await updateDoc(docSnap.ref, {
      quantity: newQty,
      price: unitPrice, // luôn giữ đơn giá mới nhất
      updatedAt: serverTimestamp(),
    });

    return { merged: true, id: docSnap.id };
  }

  // chưa có → tạo mới
  const payload = {
    id: food.id,
    name: food.name,
    image:
      food.image ||
      food.imageUrl ||
      "https://via.placeholder.com/150?text=Food",
    category: food.category || "",
    description: food.description || "",
    sizes: Array.isArray(food.sizes) ? food.sizes : [],
    bases: Array.isArray(food.bases) ? food.bases : null,
    toppings: Array.isArray(food.toppings) ? food.toppings : null,
    addOns: Array.isArray(food.addOns) ? food.addOns : null,

    // lựa chọn của người dùng
    selectedSize,
    selectedBase,
    selectedTopping,
    selectedAddOn,
    note,
    quantity,
    price: unitPrice,
    signature,
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

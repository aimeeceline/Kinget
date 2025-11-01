// src/services/cartClient.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@shared/FireBase";

/**
 * GIỐNG APP:
 * `${food.id || food.name}-${size || noSize}-${base || noBase}-${topping || noTop}-${addOn || noAdd}-${note || noNote}`
 */
function buildSignature(product, { selectedSize, selectedBase, selectedTopping, note }) {
  const sizePart = selectedSize?.label || "noSize";
  const basePart = selectedBase?.label || "noBase";

  // ⚠️ app dùng "noTop" nha
  let toppingPart = "noTop";
  if (Array.isArray(selectedTopping) && selectedTopping.length > 0) {
    toppingPart = selectedTopping.map((t) => t.label).join("+");
  } else if (selectedTopping && selectedTopping.label) {
    toppingPart = selectedTopping.label;
  }

  const addPart = "noAdd";
  const notePart = note?.trim() || "noNote";

  return `${product.id || product.name}-${sizePart}-${basePart}-${toppingPart}-${addPart}-${notePart}`;
}

// tính đơn giá giống bên app (size + topping)
function calcPrice(product, { selectedSize, selectedTopping }) {
  let price = 0;

  // ưu tiên size
  if (selectedSize?.price != null) {
    price = selectedSize.price;
  } else if (typeof product.price === "number") {
    price = product.price;
  } else if (Array.isArray(product.sizes) && product.sizes[0]?.price != null) {
    price = product.sizes[0].price;
  }

  // cộng topping
  if (Array.isArray(selectedTopping)) {
    for (const t of selectedTopping) {
      if (typeof t.price === "number") price += t.price;
    }
  } else if (selectedTopping?.price != null) {
    price += selectedTopping.price;
  }

  return price;
}

/**
 * addToCart(userId, product, options)
 * web sẽ lưu THEO APP
 */
export async function addToCart(userId, product, options = {}) {
  if (!userId) throw new Error("NO_AUTH");
  if (!product) throw new Error("NO_PRODUCT");

  const {
    selectedSize = null,
    selectedBase = null,
    selectedTopping = null,
    selectedAddOn = null, // để đúng chỗ
    note = "",
    quantity = 1,
  } = options;

  const signature = buildSignature(product, {
    selectedSize,
    selectedBase,
    selectedTopping,
    note,
  });

  const cartCol = collection(db, "users", userId, "cart");

  // 1. kiếm món trùng chữ ký
  const snap = await getDocs(query(cartCol, where("signature", "==", signature)));

  const unitPrice = calcPrice(product, { selectedSize, selectedTopping });

  // payload giống app nhất có thể
  const basePayload = {
    // 👇 app dùng "id" chứ không phải "productId"
    id: product.id,
    name: product.name,
    image:
      product.image ||
      product.imageUrl ||
      "https://via.placeholder.com/150?text=Food",
    category: product.category || "",
    description: product.description || "",
    // mấy cục dưới là “dư” nhưng app hay lưu → mình cũng lưu
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    bases: Array.isArray(product.bases) ? product.bases : null,
    addOns: Array.isArray(product.addOns) ? product.addOns : null,
    toppings: Array.isArray(product.toppings) ? product.toppings : null,

    price: unitPrice,
    quantity,
    selectedSize,
    selectedBase,
    selectedTopping,
    selectedAddOn,
    note,
    signature,
    createdAt: serverTimestamp(),
  };

  if (!snap.empty) {
    // đã có → tăng số lượng thôi
    const existedDoc = snap.docs[0];
    const existedData = existedDoc.data();
    const oldQty =
      typeof existedData.quantity === "number" ? existedData.quantity : 1;
    const newQty = oldQty + quantity;

    await updateDoc(existedDoc.ref, {
      quantity: newQty,
      price: unitPrice, // giữ đơn giá mới nhất
      updatedAt: serverTimestamp(),
    });

    return { merged: true, id: existedDoc.id };
  }

  // chưa có → tạo mới
  const newDoc = await addDoc(cartCol, basePayload);
  return { merged: false, id: newDoc.id };
}

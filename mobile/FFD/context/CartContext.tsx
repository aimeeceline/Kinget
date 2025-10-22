import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { FoodOrderItem } from "../types/food";
import { db } from "../data/FireBase";
import { useAuth } from "./AuthContext";
import { useMessageBox } from "./MessageBoxContext";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

// 🧩 Kiểu dữ liệu context
interface CartContextType {
  cart: FoodOrderItem[];
  addToCart: (food: FoodOrderItem, quantity?: number) => void;
  removeFromCart: (index: number) => void;
  handleRemoveItem: (index: number) => Promise<void>;
  clearCart: () => void;
  getTotalItems: () => number;
  increaseQtyInCart: (index: number) => void;
  decreaseQtyInCart: (index: number, handleRemoveItem?: (index: number) => Promise<void>) => void;
  setCart: React.Dispatch<React.SetStateAction<FoodOrderItem[]>>;
  address: string | null;
  setAddress: (newAddress: string) => void;
}

// 🧩 Context khởi tạo
export const CartContext = createContext<CartContextType>({
  cart: [],
  setCart: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  handleRemoveItem: async (index: number) => {},
  clearCart: () => {},
  getTotalItems: () => 0,
  increaseQtyInCart: () => {},
  decreaseQtyInCart: () => {},
  address: null,
  setAddress: () => {},
});

// ✅ Hook tiện lợi
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider />");
  return ctx;
};



// 🧩 Provider chính
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { show, confirm} = useMessageBox();
  const [cart, setCart] = useState<FoodOrderItem[]>([]);
  const [address, setAddress] = useState<string>(
    "284 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh"
  );

  // 🔁 Lắng nghe realtime Firestore
  useEffect(() => {
    if (!user?.id) {
      setCart([]);
      return;
    }

    const cartRef = collection(db, "users", user.id, "cart");
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        firestoreId: doc.id, // lưu lại ID Firestore
        ...doc.data(),
      })) as FoodOrderItem[];
      setCart(list);
    });

    return unsubscribe;
  }, [user?.id]);
      const getSignature = (food: FoodOrderItem) =>
      `${food.id || food.name}-${food.selectedSize?.label || "noSize"}-${
        food.selectedBase?.label || "noBase"
      }-${food.selectedTopping?.label || "noTop"}-${food.selectedAddOn?.label || "noAdd"}-${
        food.note?.trim() || "noNote"
      }`;


  // ✅ Thêm món vào Firestore + state
  const addToCart = async (food: FoodOrderItem, quantity: number = 1) => {
  const signature = getSignature(food);

  if (!user?.id) {
    // 🔹 Nếu chưa đăng nhập, lưu local tạm
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => getSignature(i) === signature);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { ...food, quantity }];
    });
    return;
  }

  // 🔹 Firestore: lưu cart riêng cho từng user
  const cartRef = collection(db, "users", user.id, "cart");

  // Kiểm tra món đã tồn tại chưa
  const existingItem = cart.find((i) => getSignature(i) === signature);

  if (existingItem && existingItem.firestoreId) {
    // 🔁 Cập nhật số lượng nếu trùng
    const updated = { ...existingItem, quantity: existingItem.quantity + quantity };
    await setDoc(doc(cartRef, existingItem.firestoreId), updated);
  } else {
    // 🆕 Thêm mới (có signature để truy vết)
    const newItem = { ...food, quantity, signature };
    await addDoc(cartRef, newItem);
  }
};

    // ✅ Xóa món có confirm trước
    const handleRemoveItem = async (index: number) => {
      const item = cart[index];
      const ok = await confirm(`Bạn có muốn xóa "${item.name}" khỏi giỏ hàng?`);
      if (!ok) return;

      await removeFromCart(index);
      show("Đã xóa món khỏi giỏ hàng!", "success");
    };

  // ✅ Xóa món theo index
  const removeFromCart = async (index: number) => {
    if (!user?.id) {
      setCart((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    const item = cart[index];
    if (item.firestoreId) {
      await deleteDoc(doc(db, "users", user.id, "cart", item.firestoreId));
    }
  };

  // ✅ Xóa toàn bộ giỏ
  const clearCart = async () => {
    if (!user?.id) return setCart([]);
    const cartRef = collection(db, "users", user.id, "cart");
    const docs = await getDocs(cartRef);
    docs.forEach(async (d) => await deleteDoc(d.ref));
  };

  // ✅ Đếm tổng số lượng
  const getTotalItems = () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // ✅ Tăng số lượng
const increaseQtyInCart = async (index: number) => {
  const item = cart[index];
  const updated = { ...item, quantity: item.quantity + 1 };

  if (!user?.id) {
    // 👤 Guest mode — chỉ cập nhật local
    setCart((prev) => {
      const updatedCart = [...prev];
      updatedCart[index] = updated;
      return updatedCart;
    });
    return;
  }

  if (item.firestoreId) {
    await setDoc(doc(db, "users", user.id, "cart", item.firestoreId), updated);
  }
};

// ✅ Giảm số lượng (có confirm khi quantity = 1)
const decreaseQtyInCart = async (index: number) => {
  const item = cart[index];

  // ⚠️ Nếu chỉ còn 1 → hỏi trước khi xóa
  if (item.quantity <= 1) {
    await handleRemoveItem(index);
    return;
  }

  const updated = { ...item, quantity: item.quantity - 1 };

  if (!user?.id) {
    setCart((prev) => {
      const updatedCart = [...prev];
      updatedCart[index] = updated;
      return updatedCart;
    });
    return;
  }

  if (item.firestoreId) {
    await setDoc(doc(db, "users", user.id, "cart", item.firestoreId), updated);
  }
};



  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        handleRemoveItem,
        clearCart,
        getTotalItems,
        increaseQtyInCart,
        decreaseQtyInCart,
        setCart,
        address,
        setAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

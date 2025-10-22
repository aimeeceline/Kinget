import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { FoodOrderItem } from "../types/food";
import { db } from "../data/FireBase";
import { useAuth } from "./AuthContext";
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
  clearCart: () => void;
  getTotalItems: () => number;
  increaseQtyInCart: (index: number) => void;
  decreaseQtyInCart: (index: number) => void;
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

  // ✅ Thêm món vào Firestore + state
  const addToCart = async (food: FoodOrderItem, quantity: number = 1) => {
    if (!user?.id) {
      console.warn("⚠️ Người dùng chưa đăng nhập, không thể lưu giỏ hàng!");
      setCart((prev) => [...prev, { ...food, quantity }]);
      return;
    }

    const cartRef = collection(db, "users", user.id, "cart");

    // Kiểm tra món đã tồn tại trong giỏ chưa
    const existingItem = cart.find(
      (item) =>
        item.id === food.id &&
        item.selectedSize?.label === food.selectedSize?.label &&
        item.selectedBase?.label === food.selectedBase?.label &&
        item.selectedTopping?.label === food.selectedTopping?.label &&
        item.selectedAddOn?.label === food.selectedAddOn?.label &&
        (item.note?.trim() || "") === (food.note?.trim() || "")
    );

    if (existingItem) {
      // 🔁 Cập nhật số lượng nếu trùng
      const updated = { ...existingItem, quantity: existingItem.quantity + quantity };
      if (existingItem.firestoreId) {
        await setDoc(doc(cartRef, existingItem.firestoreId), updated);
      }
    } else {
      // 🆕 Nếu chưa có, thêm mới với ID ngẫu nhiên (tránh trùng burger/drink)
      const newItem = { ...food, quantity };
      await addDoc(cartRef, newItem);
    }
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
    if (user?.id && item.firestoreId) {
      await setDoc(doc(db, "users", user.id, "cart", item.firestoreId), updated);
    }
  };

  // ✅ Giảm số lượng
  const decreaseQtyInCart = async (index: number) => {
    const item = cart[index];
    if (item.quantity <= 1) {
      removeFromCart(index);
      return;
    }
    const updated = { ...item, quantity: item.quantity - 1 };
    if (user?.id && item.firestoreId) {
      await setDoc(doc(db, "users", user.id, "cart", item.firestoreId), updated);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
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

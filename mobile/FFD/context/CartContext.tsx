import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FoodOrderItem } from "../types/food";
import { db } from "../data/FireBase";
import { useAuth } from "./AuthContext";
import { useMessageBox } from "./MessageBoxContext";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CartContextType {
  cartByBranch: Record<string, FoodOrderItem[]>;
  selectedBranch: string | null;
  setSelectedBranch: (branchId: string) => void;
  addToCart: (food: FoodOrderItem, branchId: string, quantity?: number) => Promise<void>;
  removeFromCart: (branchId: string, index: number) => Promise<void>;
  handleRemoveItem: (branchId: string, index: number) => Promise<void>;
  clearCart: (branchId?: string) => Promise<void>;
  getTotalItems: (branchId?: string) => number;
  increaseQtyInCart: (branchId: string, index: number) => Promise<void>;
  decreaseQtyInCart: (branchId: string, index: number) => Promise<void>;
  address: string | null;
  setAddress: (newAddress: string) => void;
}

export const CartContext = createContext<CartContextType>({} as any);
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { show, confirm } = useMessageBox();

  const [cartByBranch, setCartByBranch] = useState<Record<string, FoodOrderItem[]>>({});
  const [selectedBranch, setSelectedBranchState] = useState<string | null>(null);
  const [address, setAddress] = useState<string>(
    "284 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh"
  );

  // 🧭 Đọc chi nhánh đã chọn
  useEffect(() => {
    AsyncStorage.getItem("selectedBranch").then((b) => {
      if (b) setSelectedBranchState(b);
    });
  }, []);

  const setSelectedBranch = (branchId: string) => {
    setSelectedBranchState(branchId);
    AsyncStorage.setItem("selectedBranch", branchId);
  };

  // 🔥 Lắng nghe realtime chỉ giỏ của chi nhánh được chọn
  useEffect(() => {
    if (!user?.id || !selectedBranch) {
      setCartByBranch({});
      return;
    }

    const itemsRef = collection(db, "users", user.id, "carts", selectedBranch, "items");
    console.log("📡 Listening cart for branch:", selectedBranch);

    const unsubscribe = onSnapshot(itemsRef, (snap) => {
      const items = snap.docs.map((d) => ({
        firestoreId: d.id,
        ...d.data(),
      })) as FoodOrderItem[];

      setCartByBranch({ [selectedBranch]: items });
    });

    return () => unsubscribe();
  }, [user?.id, selectedBranch]);

  // 🧮 Tạo signature
  const getSignature = (food: FoodOrderItem): string => {
    const sortedToppings = food.selectedTopping?.map((t) => t.label).sort().join("+") || "noTop";
    const sortedAddOns = food.selectedAddOn?.map((a) => a.label).sort().join("+") || "noAdd";
    return `${food.name}-${food.selectedSize?.label || "noSize"}-${food.selectedBase?.label || "noBase"}-${sortedToppings}-${sortedAddOns}-${food.note?.trim() || "noNote"}`;
  };

  // ✅ Thêm món vào giỏ (chỉ cho branch hiện tại)
  const addToCart = async (food: FoodOrderItem, branchId: string, quantity: number = 1) => {
    if (!branchId) {
      show("Vui lòng chọn chi nhánh!", "info");
      return;
    }

    if (!user?.id) {
      show("Bạn cần đăng nhập để thêm vào giỏ!", "info");
      return;
    }

    const signature = getSignature(food);
    const branchCart = cartByBranch[branchId] || [];
    const existing = branchCart.find((i) => i.signature === signature);
    const itemsRef = collection(db, "users", user.id, "carts", branchId, "items");

    const newItem = {
      id: food.id,
      name: food.name,
      image: food.image || "",
      category: food.category,
      isActive: true,
      price: food.price || 0,
      quantity,
      selectedSize: food.selectedSize || null,
      selectedBase: food.selectedBase || null,
      selectedAddOn: food.selectedAddOn || [],
      selectedTopping: food.selectedTopping || [],
      note: food.note || "",
      signature,
      createdAt: serverTimestamp(),
    };

    try {
      if (existing?.firestoreId) {
        const itemRef = doc(itemsRef, existing.firestoreId);
        await setDoc(
          itemRef,
          { quantity: existing.quantity + quantity, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } else {
        await addDoc(itemsRef, newItem);
      }
    } catch (e) {
      console.error("❌ Error adding to cart:", e);
    }
  };

  const removeFromCart = async (branchId: string, index: number) => {
    const item = cartByBranch[branchId]?.[index];
    if (!item || !user?.id || !item.firestoreId) return;
    const ref = doc(db, "users", user.id, "carts", branchId, "items", item.firestoreId);
    await deleteDoc(ref);
  };

  const handleRemoveItem = async (branchId: string, index: number) => {
    const item = cartByBranch[branchId]?.[index];
    if (!item) return;
    const ok = await confirm(`Xóa "${item.name}" khỏi giỏ hàng?`);
    if (ok) await removeFromCart(branchId, index);
  };

  const clearCart = async (branchId?: string) => {
    if (!user?.id) return;
    const targetBranch = branchId || selectedBranch;
    if (!targetBranch) return;

    const itemsRef = collection(db, "users", user.id, "carts", targetBranch, "items");
    const docs = await getDocs(itemsRef);
    for (const d of docs.docs) await deleteDoc(d.ref);
  };

  const increaseQtyInCart = async (branchId: string, index: number) => {
    const item = cartByBranch[branchId]?.[index];
    if (!item?.firestoreId || !user?.id) return;
    const ref = doc(db, "users", user.id, "carts", branchId, "items", item.firestoreId);
    await setDoc(ref, { quantity: item.quantity + 1, updatedAt: serverTimestamp() }, { merge: true });
  };

  const decreaseQtyInCart = async (branchId: string, index: number) => {
    const item = cartByBranch[branchId]?.[index];
    if (!item?.firestoreId || !user?.id) return;
    if (item.quantity <= 1) return handleRemoveItem(branchId, index);
    const ref = doc(db, "users", user.id, "carts", branchId, "items", item.firestoreId);
    await setDoc(ref, { quantity: item.quantity - 1, updatedAt: serverTimestamp() }, { merge: true });
  };

  const getTotalItems = (branchId?: string) => {
    if (!branchId) {
      const b = selectedBranch;
      return (cartByBranch[b || ""] || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
    }
    return (cartByBranch[branchId] || []).reduce(
      (sum, i) => sum + (i.quantity || 0),
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartByBranch,
        selectedBranch,
        setSelectedBranch,
        addToCart,
        removeFromCart,
        handleRemoveItem,
        clearCart,
        getTotalItems,
        increaseQtyInCart,
        decreaseQtyInCart,
        address,
        setAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

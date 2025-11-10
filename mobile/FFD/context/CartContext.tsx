import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CartContextType {
  cartByBranch: Record<string, FoodOrderItem[]>;
  selectedBranch: string | null;
  setSelectedBranch: (branchId: string) => void;
  addToCart: (
    food: FoodOrderItem,
    branchId: string,
    quantity?: number
  ) => Promise<void>;
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

  const setSelectedBranch = (branchId: string) => {
    setSelectedBranchState(branchId);
    AsyncStorage.setItem("selectedBranch", branchId);
  };

  useEffect(() => {
    AsyncStorage.getItem("selectedBranch").then((b) => {
      if (b) setSelectedBranchState(b);
    });
  }, []);

  // 🔁 Lắng nghe realtime
  useEffect(() => {
    if (!user?.id) {
      setCartByBranch({});
      return;
    }

    const unsubscribers: (() => void)[] = [];
    const cartsRef = collection(db, "users", user.id, "carts");

    console.log("👤 Đang theo dõi Firestore user:", user.id);

    const unsubscribeMain = onSnapshot(cartsRef, (branchSnaps) => {
      const branchIds = branchSnaps.docs.map((d) => d.id);
      console.log("🔥 Firestore cập nhật branches:", branchIds);

      branchSnaps.docChanges().forEach((change) => {
        const branchId = change.doc.id;
        console.log("📡 Branch change:", branchId, change.type);

        const itemsRef = collection(
          db,
          "users",
          user.id,
          "carts",
          branchId,
          "items"
        );
        const unsubscribeItems = onSnapshot(itemsRef, (snap) => {
          const items = snap.docs.map((d) => ({
            firestoreId: d.id,
            ...d.data(),
          })) as FoodOrderItem[];

          console.log(`📦 ${branchId} có ${items.length} món`);
          setCartByBranch((prev) => ({
            ...prev,
            [branchId]: items,
          }));
        });
        unsubscribers.push(unsubscribeItems);
      });
    });

    return () => {
      unsubscribeMain();
      unsubscribers.forEach((u) => u());
    };
  }, [user?.id]);

  // 🧮 Tạo key định danh món (đảm bảo thứ tự các phần tử không ảnh hưởng)
const getSignature = (food: FoodOrderItem): string => {
  const sortedToppings =
    food.selectedTopping
      ?.map((t) => t.label)
      .sort()
      .join("+") || "noTop";

  const sortedAddOns =
    food.selectedAddOn
      ?.map((a) => a.label)
      .sort()
      .join("+") || "noAdd";

  return `${food.name}-${food.selectedSize?.label || "noSize"}-${
    food.selectedBase?.label || "noBase"
  }-${sortedToppings}-${sortedAddOns}-${food.note?.trim() || "noNote"}`;
};

  // ✅ Thêm món vào giỏ (kiểm tra trùng qua cartByBranch local)
const addToCart = async (
  food: FoodOrderItem,
  branchId: string,
  quantity: number = 1
): Promise<void> => {
  if (!branchId) {
    console.warn("⚠️ Thiếu branchId khi addToCart");
    return;
  }

  const signature = getSignature(food);

  // ========================
  // 👤 Nếu chưa đăng nhập → lưu local (state)
  // ========================
  if (!user?.id) {
    setCartByBranch((prev) => {
      const branchCart = prev[branchId] || [];
      const existingIndex = branchCart.findIndex(
        (i) => getSignature(i) === signature
      );

      if (existingIndex >= 0) {
        // 🔁 Tăng số lượng nếu món đã có
        const updated = [...branchCart];
        updated[existingIndex].quantity += quantity;
        return { ...prev, [branchId]: updated };
      }

      // 🆕 Nếu chưa có → thêm mới
      return {
        ...prev,
        [branchId]: [...branchCart, { ...food, quantity }],
      };
    });
    return;
  }

  // ========================
  // 🔥 Nếu có đăng nhập → lưu Firestore
  // ========================

  const branchCart = cartByBranch[branchId] || [];
  const existingItem = branchCart.find(
    (i) => i.signature === signature || getSignature(i) === signature
  );

  const itemsRef = collection(db, "users", user.id, "carts", branchId, "items");

  try {
    if (existingItem && existingItem.firestoreId) {
      // 🔁 Nếu món đã có → cập nhật số lượng
      const itemRef = doc(
        db,
        "users",
        user.id,
        "carts",
        branchId,
        "items",
        existingItem.firestoreId
      );

      await setDoc(
        itemRef,
        {
          ...existingItem,
          quantity: (existingItem.quantity || 1) + quantity,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      console.log(`🔁 Cập nhật số lượng món "${food.name}"`);
    } else {
      // 🆕 Nếu chưa có → thêm mới vào Firestore
      const newItem = {
        ...food,
        quantity,
        signature,
        createdAt: Date.now(),
      };

      await addDoc(itemsRef, newItem);
      console.log(`🆕 Thêm mới món "${food.name}" vào giỏ hàng chi nhánh ${branchId}`);
    }
  } catch (error) {
    console.error("❌ Lỗi khi thêm/cập nhật giỏ hàng:", error);
  }
};

  const removeFromCart = async (branchId: string, index: number) => {
    const item = cartByBranch[branchId]?.[index];
    if (!item || !user?.id || !item.firestoreId) return;
    const itemRef = doc(
      db,
      "users",
      user.id,
      "carts",
      branchId,
      "items",
      item.firestoreId
    );
    await deleteDoc(itemRef);
  };

  const handleRemoveItem = async (branchId: string, index: number) => {
    const item = cartByBranch[branchId]?.[index];
    if (!item) return;
    const ok = await confirm(`Bạn có muốn xóa "${item.name}" khỏi giỏ hàng?`);
    if (ok) await removeFromCart(branchId, index);
  };

  const clearCart = async (branchId?: string) => {
    if (!user?.id) return;
    if (branchId) {
      const itemsRef = collection(db, "users", user.id, "carts", branchId, "items");
      const docs = await getDocs(itemsRef);
      for (const d of docs.docs) await deleteDoc(d.ref);
    } else {
      for (const branchId in cartByBranch) {
        const itemsRef = collection(db, "users", user.id, "carts", branchId, "items");
        const docs = await getDocs(itemsRef);
        for (const d of docs.docs) await deleteDoc(d.ref);
      }
    }
  };

  const increaseQtyInCart = async (branchId: string, index: number) => {
    const item = cartByBranch[branchId]?.[index];
    if (!item || !user?.id || !item.firestoreId) return;
    const itemRef = doc(
      db,
      "users",
      user.id,
      "carts",
      branchId,
      "items",
      item.firestoreId
    );
    await setDoc(itemRef, { ...item, quantity: item.quantity + 1 });
  };

  const decreaseQtyInCart = async (branchId: string, index: number) => {
    const item = cartByBranch[branchId]?.[index];
    if (!item || !user?.id || !item.firestoreId) return;
    const itemRef = doc(
      db,
      "users",
      user.id,
      "carts",
      branchId,
      "items",
      item.firestoreId
    );
    if (item.quantity <= 1) await handleRemoveItem(branchId, index);
    else await setDoc(itemRef, { ...item, quantity: item.quantity - 1 });
  };

  const getTotalItems = (branchId?: string) => {
    if (!branchId)
      return Object.values(cartByBranch)
        .flat()
        .reduce((sum, i) => sum + (i.quantity || 0), 0);
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

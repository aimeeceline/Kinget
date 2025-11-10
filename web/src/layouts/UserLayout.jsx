// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuth.jsx";
import AddressBranchModal from "../components/AddressBranchModal.jsx";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

import { db } from "@shared/FireBase";
import { collection, onSnapshot } from "firebase/firestore";

export default function UserLayout() {
  const { user } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // bật modal nếu cần
  useEffect(() => {
    if (!user) return;
    const need = localStorage.getItem("needsAddressSetup");
    if (need === "1") {
      setShowModal(true);
    }
  }, [user]);

  // nghe giỏ hàng để hiện số ở header
  useEffect(() => {
    if (!user?.id) {
      setCartCount(0);
      return;
    }

    const colRef = collection(db, "users", user.id, "cart");
    const unsub = onSnapshot(colRef, (snap) => {
      const currentBranchId = localStorage.getItem("selectedBranchId");

      // nếu chưa chọn chi nhánh -> tính hết
      const total = snap.docs.reduce((sum, d) => {
        const data = d.data();

        // lọc theo chi nhánh
        if (currentBranchId && data.branchId !== currentBranchId) {
          return sum;
        }

        const qty =
          typeof data.quantity === "number" && data.quantity > 0
            ? data.quantity
            : 1;
        return sum + qty;
      }, 0);

      setCartCount(total);
    });

    return () => unsub();
  }, [user]);

  return (
    <>
      <Header cartCount={cartCount} />
      <Outlet />

      <AddressBranchModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />

      <Footer />
    </>
  );
}

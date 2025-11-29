// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuth.jsx";
import AddressBranchModal from "../components/AddressBranchModal.jsx";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

import { listenCart } from "../services/cartClient";

export default function UserLayout() {
  const { user } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // 👉 Theo dõi branch hiện tại (đọc từ localStorage)
  const [branchId, setBranchId] = useState(
    localStorage.getItem("selectedBranchId") || ""
  );

  // bật modal nếu cần
  useEffect(() => {
    if (!user) return;
    const need = localStorage.getItem("needsAddressSetup");
    if (need === "1") {
      setShowModal(true);
    }
  }, [user]);

  // 🔔 Nghe event "branch-changed" do Header bắn ra
  useEffect(() => {
    const handleBranchChange = () => {
      const newId = localStorage.getItem("selectedBranchId") || "";
      setBranchId(newId);
    };

    window.addEventListener("branch-changed", handleBranchChange);
    return () => {
      window.removeEventListener("branch-changed", handleBranchChange);
    };
  }, []);

  // 🎧 Nghe giỏ hàng (nhánh hiện tại) để hiện số ở header
  useEffect(() => {
    if (!user?.id) {
      setCartCount(0);
      return;
    }

    const unsub = listenCart(user.id, (items) => {
      const total = items.reduce((sum, it) => {
        const qty =
          typeof it.quantity === "number" && it.quantity > 0
            ? it.quantity
            : 1;
        return sum + qty;
      }, 0);

      setCartCount(total);
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [user?.id, branchId]); // 👈 branchId đổi → re-subscribe listenCart

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

// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuth.jsx";
import AddressBranchModal from "../components/AddressBranchModal.jsx";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
// import Footer nếu bạn có

export default function UserLayout() {
  const { user } = useAuthContext();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // chỉ bật nếu đã login
    if (!user) return;
    const need = localStorage.getItem("needsAddressSetup");
    if (need === "1") {
      setShowModal(true);
    }
  }, [user]);

  return (
    <>
      <Header />
      <Outlet />
      {/* <Footer /> */}

      <AddressBranchModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
      <Footer />
    </>
  );
}

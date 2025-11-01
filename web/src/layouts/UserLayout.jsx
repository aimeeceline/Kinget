// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const UserLayout = () => {
  return (
    <>
      <Header />
      <main style={{ minHeight: "60vh" }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default UserLayout;

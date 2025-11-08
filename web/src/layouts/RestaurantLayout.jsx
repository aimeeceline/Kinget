// src/layouts/RestaurantLayout.jsx
import { Outlet } from "react-router-dom";
import RestaurantSidebar from "../components/Restaurant/Sidebar.jsx";

export default function RestaurantLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <RestaurantSidebar />
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}

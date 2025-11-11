// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/Admin/Sidebar.jsx";

export default function AdminLayout() {
  return (
    <div className="adm-shell">
      <AdminSidebar />

      <div className="adm-main">
                <main className="adm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

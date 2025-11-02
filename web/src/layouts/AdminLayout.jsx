// src/layouts/AdminLayout.jsx
import { Outlet, NavLink } from "react-router-dom";
//import "./AdminLayout.css"; // nếu bạn có

const AdminLayout = () => {
  return (
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "#111827",
          color: "#fff",
          padding: "16px 12px",
        }}
      >
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>Admin</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink to="/admin" end style={{ color: "#fff" }}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/orders" style={{ color: "#fff" }}>
            Orders
          </NavLink>
        </nav>
      </aside>

      <div style={{ flex: 1, background: "#f3f4f6" }}>
        <header style={{ padding: 12, background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <h1 style={{ fontSize: 20 }}>Admin Panel</h1>
        </header>
        <main style={{ padding: 16 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

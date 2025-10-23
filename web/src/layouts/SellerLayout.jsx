import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

export default function SellerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="seller-shell" style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100dvh" }}>
      {/* Sidebar trái */}
      <aside style={{ background: "#111827", color: "#fff", padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Seller Center</div>
        <nav className="seller-nav" style={{ display: "grid", gap: 8 }}>
          <NavLink to="/seller" end className="seller-link">Dashboard</NavLink>
          <NavLink to="/seller/orders" className="seller-link">Orders</NavLink>
          <NavLink to="/seller/products" className="seller-link">Products</NavLink>
        </nav>
      </aside>

      {/* Khu vực chính */}
      <div style={{ display: "grid", gridTemplateRows: "56px 1fr" }}>
        <header style={{ display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #eee" }}>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 600 }}>{user?.username || user?.email}</span>
            <button onClick={logout} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
              Đăng xuất
            </button>
          </div>
        </header>

        <div style={{ padding: 16 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

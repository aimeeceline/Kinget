// src/components/Restaurant/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import "../css/Sidebar.css";

export default function RestaurantSidebar() {
  const { user } = useAuthContext();

  const displayName =
    user?.restaurantName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Nhà hàng";

  return (
    <aside className="rest-sidebar">
      <div className="rest-brand">
        <div className="rest-brand-circle">🍔</div>
        <div className="rest-brand-text">
          <div className="rest-brand-name">{displayName}</div>
          <div className="rest-brand-sub">Restaurant panel</div>
        </div>
      </div>

      <nav className="rest-nav">
        <NavLink
          to="/restaurant"
          end
          className={({ isActive }) =>
            isActive ? "rest-link active" : "rest-link"
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/restaurant/orders"
          className={({ isActive }) =>
            isActive ? "rest-link active" : "rest-link"
          }
        >
          Đơn hàng
        </NavLink>
        <NavLink
          to="/restaurant/menu"
          className={({ isActive }) =>
            isActive ? "rest-link active" : "rest-link"
          }
        >
          Quản lý menu
        </NavLink>
      </nav>
    </aside>
  );
}

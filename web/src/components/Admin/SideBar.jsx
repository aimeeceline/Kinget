// src/components/admin/AdminSidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import "../css/Sidebar.css";

export default function AdminSidebar() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  return (
    <aside className="adm-sidebar">
      <div className="adm-brand">
        <div className="adm-brand-circle">⚙️</div>
        <div className="adm-brand-text">
          <div className="adm-brand-name">Admin</div>
        </div>
      </div>

      <nav className="adm-nav">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/orders"
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Đơn hàng
        </NavLink>

        <NavLink
          to="/admin/foods"
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Món ăn
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Người dùng
        </NavLink>

        <NavLink
          to="/admin/branches"
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Chi nhánh
        </NavLink>

        <NavLink
          to="/admin/drones"
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Drone
        </NavLink>
      </nav>

      <div className="adm-bottom">
        <div className="adm-user-name">
          {user?.email}
        </div>
        <button onClick={handleLogout} className="adm-logout" type="button">
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

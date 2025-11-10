import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import { db } from "@shared/FireBase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "../css/Sidebar.css";

export default function RestaurantSidebar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||    "Nhà hàng";

  // lắng nghe đơn của chi nhánh này
  useEffect(() => {
    if (!user?.id) return;
    const branchId = user?.branchId || user?.restaurantBranchId;
    if (!branchId) return;

    // để đỡ phải tạo index: chỉ filter branch, còn status lọc ở client
    const q = query(
      collection(db, "orders"),
      where("branchId", "==", branchId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        // checkout của bạn lưu là "processing"
        if (data.status === "processing" || data.status === "pending") {
          count += 1;
        }
      });
      setPendingCount(count);
    });

    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  return (
    <aside className="rest-sidebar">
      <div className="rest-brand">
        <div className="rest-brand-circle">🍔</div>
        <div className="rest-brand-text">
          <div className="rest-brand-name">{displayName}</div>
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
          Quản lý đơn hàng
          {pendingCount > 0 && (
            <span className="rest-badge">{pendingCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/restaurant/menu"
          className={({ isActive }) =>
            isActive ? "rest-link active" : "rest-link"
          }
        >
          Quản lý món ăn
        </NavLink>
      </nav>

      <button type="button" className="rest-logout" onClick={handleLogout}>
        Đăng xuất
      </button>
    </aside>
  );
}

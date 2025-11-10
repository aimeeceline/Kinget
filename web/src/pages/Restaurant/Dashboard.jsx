import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, doc, collectionGroup } from "firebase/firestore";
import { db } from "@shared/FireBase";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import { Timestamp } from "firebase/firestore";
import "../css/Restaurant/Dashboard.css";

export default function RestaurantDashboard() {
  const { user } = useAuthContext();
  const branchId = user?.branchId || user?.restaurantBranchId || "";
  const [todayOrders, setTodayOrders] = useState([]);
  const [activeFoods, setActiveFoods] = useState(0);
  const [loading, setLoading] = useState(true);

  // tính đầu ngày hôm nay
  const startOfToday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  })();

  // 1) nghe đơn hôm nay của chi nhánh
  useEffect(() => {
    if (!branchId) {
      setTodayOrders([]);
      setLoading(false);
      return;
    }

    // orders where branchId == ... and createdAt >= today
    // bạn đã tạo index branchId+createdAt rồi nên ok
    const q = query(
      collection(db, "orders"),
      where("branchId", "==", branchId),
      where("createdAt", ">=", startOfToday)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // mới nhất lên đầu
        list.sort((a, b) => {
          const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tb - ta;
        });
        setTodayOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error("load orders dashboard error", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [branchId, startOfToday]);

  // 2) đếm món đang bán của chi nhánh
  useEffect(() => {
    if (!branchId) return;
    const foodsRef = collection(db, "branches", branchId, "branchFoods");
    const unsub = onSnapshot(
      foodsRef,
      (snap) => {
        let active = 0;
        snap.forEach((d) => {
          const data = d.data();
          if (data.isActive) active += 1;
        });
        setActiveFoods(active);
      },
      (err) => {
        console.error("load branch foods error", err);
      }
    );
    return () => unsub();
  }, [branchId]);

  // 3) tính doanh thu hôm nay
  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
    0
  );

  return (
    <div className="rest-dash-wrap">
      <div className="rest-dash-head">
        <div>
          <h1 className="rest-dash-title">
            Xin chào{branchId ? `, CN ${branchId}` : ""} 👋
          </h1>
          <p className="rest-dash-sub">Tổng quan nhanh về hoạt động hôm nay.</p>
        </div>
      </div>

      {/* cards */}
      <div className="rest-dash-cards">
        <div className="rest-dash-card">
          <p className="rd-label">Đơn hôm nay</p>
          <p className="rd-value">
            {loading ? "…" : todayOrders.length}
          </p>
        </div>
        <div className="rest-dash-card">
          <p className="rd-label">Món đang bán</p>
          <p className="rd-value">{activeFoods}</p>
        </div>
        <div className="rest-dash-card">
          <p className="rd-label">Doanh thu hôm nay</p>
          <p className="rd-value">
            {todayRevenue.toLocaleString("vi-VN")}₫
          </p>
        </div>
      </div>

      {/* recent orders */}
      <div className="rest-dash-box">
        <div className="rest-dash-box-head">
          <h2>Đơn gần đây</h2>
        </div>

        {todayOrders.length === 0 ? (
          <p className="rd-empty">Hôm nay chưa có đơn.</p>
        ) : (
          <table className="rd-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách</th>
                <th>SĐT</th>
                <th>Tổng</th>
                <th>Tình trạng</th>
                <th>Giờ</th>
              </tr>
            </thead>
            <tbody>
              {todayOrders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td>{o.code || o.id.slice(0, 6)}</td>
                  <td>{o.receiverName || "Khách"}</td>
                  <td>{o.receiverPhone || "—"}</td>
                  <td>{(o.total || 0).toLocaleString("vi-VN")}₫</td>
                  <td>
                    <span className={`rd-badge rd-${o.status || "other"}`}>
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td>
                    {o.createdAt?.toDate
                      ? o.createdAt
                          .toDate()
                          .toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function statusLabel(st) {
  const map = {
    processing: "Chờ xác nhận",
    preparing: "Đang chuẩn bị",
    shipping: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã huỷ",
  };
  return map[st] || "Khác";
}

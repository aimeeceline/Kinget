// src/pages/restaurant/Orders.jsx
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@shared/FireBase";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import "../css/Restaurant/Orders.css";

export default function RestaurantOrders() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", user.id),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const renderStatus = (st) => {
    const map = {
      pending: "Chờ xác nhận",
      preparing: "Đang chuẩn bị",
      delivering: "Đang giao",
      done: "Hoàn thành",
      cancelled: "Đã huỷ",
    };
    return map[st] || st || "—";
  };

  if (!user) return <p>Vui lòng đăng nhập.</p>;

  return (
    <div className="rest-orders">
      <div className="rest-orders-header">
        <h1>Quản lý đơn hàng</h1>
        <p>
          Nhà hàng: <b>{user.restaurantName || user.email}</b>
        </p>
      </div>

      {loading ? (
        <p>Đang tải đơn hàng...</p>
      ) : orders.length === 0 ? (
        <p>Chưa có đơn nào.</p>
      ) : (
        <table className="rest-orders-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Trạng thái</th>
              <th>Tổng</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.code || o.id}</td>
                <td>{o.customerName || o.userName || "Khách"}</td>
                <td>
                  <span className={`status-badge status-${o.status || "other"}`}>
                    {renderStatus(o.status)}
                  </span>
                </td>
                <td>{(o.total || 0).toLocaleString()}₫</td>
                <td>
                  {o.createdAt?.toDate
                    ? o.createdAt.toDate().toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

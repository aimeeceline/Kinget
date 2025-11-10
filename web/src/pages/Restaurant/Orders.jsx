// src/pages/restaurant/Orders.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // 👈 thêm dòng này
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import "../css/Restaurant/Orders.css";

const PAGE_SIZE = 5;

const STATUS_META = {
  processing: { label: "Chờ xác nhận", className: "badge-pending" },
  preparing: { label: "Đang chuẩn bị", className: "badge-preparing" },
  shipping: { label: "Đang giao", className: "badge-delivering" },
  completed: { label: "Hoàn thành", className: "badge-done" },
  cancelled: { label: "Đã huỷ", className: "badge-cancelled" },
};

export default function RestaurantOrders() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const branchId = user?.branchId || user?.restaurantBranchId || "";

  useEffect(() => {
    if (!user?.id) return;

    if (!branchId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("branchId", "==", branchId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        list.sort((a, b) => {
          const ta = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : 0;
          const tb = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : 0;
          return tb - ta;
        });

        setOrders(list);
        setLoading(false);
        setPage(1);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, branchId]);

  if (!user) return <p>Vui lòng đăng nhập.</p>;

  const filtered = orders.filter((o) =>
    statusFilter === "all" ? true : o.status === statusFilter
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const currentData = filtered.slice(start, start + PAGE_SIZE);

  const getStatusMeta = (status) => {
    return (
      STATUS_META[status] || {
        label: "Không xác định",
        className: "badge-unknown",
      }
    );
  };

  return (
    <div className="rest-orders-page">
      <div className="rest-filter-bar">
        <span>Lọc:</span>
        <button
          type="button"
          className={statusFilter === "all" ? "fbtn active" : "fbtn"}
          onClick={() => {
            setStatusFilter("all");
            setPage(1);
          }}
        >
          Tất cả
        </button>
        <button
          type="button"
          className={statusFilter === "processing" ? "fbtn active" : "fbtn"}
          onClick={() => {
            setStatusFilter("processing");
            setPage(1);
          }}
        >
          Chờ xác nhận
        </button>
        <button
          type="button"
          className={statusFilter === "preparing" ? "fbtn active" : "fbtn"}
          onClick={() => {
            setStatusFilter("preparing");
            setPage(1);
          }}
        >
          Đang chuẩn bị
        </button>
        <button
          type="button"
          className={statusFilter === "shipping" ? "fbtn active" : "fbtn"}
          onClick={() => {
            setStatusFilter("shipping");
            setPage(1);
          }}
        >
          Đang giao
        </button>
        <button
          type="button"
          className={statusFilter === "completed" ? "fbtn active" : "fbtn"}
          onClick={() => {
            setStatusFilter("completed");
            setPage(1);
          }}
        >
          Hoàn thành
        </button>
        <button
          type="button"
          className={statusFilter === "cancelled" ? "fbtn active" : "fbtn"}
          onClick={() => {
            setStatusFilter("cancelled");
            setPage(1);
          }}
        >
          Đã huỷ
        </button>
      </div>

      {loading ? (
        <p>Đang tải đơn hàng...</p>
      ) : filtered.length === 0 ? (
        <p>Không có đơn trong tình trạng này.</p>
      ) : (
        <>
          <table className="rest-orders-table fancy">
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Người đặt</th>
                <th>SĐT</th>
                <th>Thời gian</th>
                <th>Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((o) => {
                const st = getStatusMeta(o.status);
                return (
                  <tr key={o.id}>
                    <td>
                      <Link
                        to={`/restaurant/orders/${o.id}`}
                        className="order-link"
                      >
                        {o.code || `${o.id.slice(0, 6)}`}
                      </Link>
                    </td>
                    <td>{o.receiverName || o.customerName || "Khách"}</td>
                    <td>{o.receiverPhone || o.phone || "—"}</td>
                    <td>
                      {o.createdAt?.toDate
                        ? o.createdAt.toDate().toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td>
                      <span className={`order-badge ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* pagination kiểu menu */}
<div className="rest-orders-pagination">
  <button onClick={() => goPage(page - 1)} disabled={page === 1}>
    «
  </button>
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
    <button
      key={p}
      onClick={() => goPage(p)}
      className={p === page ? "active" : ""}
    >
      {p}
    </button>
  ))}
  <button
    onClick={() => goPage(page + 1)}
    disabled={page === totalPages}
  >
    »
  </button>
</div>
        </>
      )}
    </div>
  );
}

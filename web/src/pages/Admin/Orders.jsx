// src/pages/admin/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  collectionGroup,
  getDocs,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../../pages/css/Admin/Orders.css"; // nhớ tạo file này

const PAGE_SIZE = 10;

const STATUS_META = {
  processing: { label: "Chờ xác nhận", className: "ad-badge-pending" },
  preparing: { label: "Đang chuẩn bị", className: "ad-badge-preparing" },
  shipping: { label: "Đang giao", className: "ad-badge-delivering" },
  completed: { label: "Hoàn thành", className: "ad-badge-done" },
  cancelled: { label: "Đã huỷ", className: "ad-badge-cancelled" },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [page, setPage] = useState(1);

  // lấy toàn bộ orders (admin nên thấy hết)
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
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
  }, []);

  // lấy danh sách chi nhánh để filter
  useEffect(() => {
    async function loadBranches() {
      try {
        const snap = await getDocs(collection(db, "branches"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBranches(list);
      } catch (e) {
        console.error(e);
      }
    }
    loadBranches();
  }, []);

  // lọc theo tình trạng + chi nhánh
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const okStatus = statusFilter === "all" ? true : o.status === statusFilter;
      const okBranch = branchFilter === "all" ? true : o.branchId === branchFilter;
      return okStatus && okBranch;
    });
  }, [orders, statusFilter, branchFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const currentData = filtered.slice(start, start + PAGE_SIZE);

  const getStatusMeta = (status) =>
    STATUS_META[status] || {
      label: "Khác",
      className: "ad-badge-unknown",
    };

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="ad-orders-wrap">
      <div className="ad-orders-top">
        <div>
          <h1 className="ad-orders-title">Đơn hàng</h1>
          
        </div>

        <div className="ad-filters">
          <label>
            Chi nhánh:
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* filter status */}
      <div className="ad-status-bar">
        {[
          ["all", "Tất cả"],
          ["processing", "Chờ xác nhận"],
          ["preparing", "Đang chuẩn bị"],
          ["shipping", "Đang giao"],
          ["completed", "Hoàn thành"],
          ["cancelled", "Đã huỷ"],
        ].map(([val, label]) => (
          <button
            key={val}
            type="button"
            className={statusFilter === val ? "ad-sbtn active" : "ad-sbtn"}
            onClick={() => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Đang tải đơn hàng...</p>
      ) : filtered.length === 0 ? (
        <p>Không có đơn phù hợp.</p>
      ) : (
        <>
          <table className="ad-orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Chi nhánh</th>
                <th>Tổng</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((o) => {
                const st = getStatusMeta(o.status);
                return (
                  <tr key={o.id}>
                    <td>{o.code || o.id.slice(0, 6)}</td>
                    <td>{o.receiverName || o.customerName || "Khách"}</td>
                    <td>{o.receiverPhone || o.phone || "—"}</td>
                    <td>{o.branchId || "—"}</td>
                    <td>{(o.total || 0).toLocaleString("vi-VN")}₫</td>
                    <td>
                      {o.paymentMethod === "bank"
                        ? "Chuyển khoản"
                        : o.paymentMethod === "cash"
                        ? "Tiền mặt"
                        : "—"}
                    </td>
                    <td>
                      <span className={`ad-status ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td>
                      {o.createdAt?.toDate
                        ? o.createdAt
                            .toDate()
                            .toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* pagination */}
          <div className="ad-orders-pagination">
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

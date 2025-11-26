// src/pages/RestaurantOrders/index.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@shared/FireBase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import "../css/Restaurant/Orders.css";

const STATUS_TABS = [
  { key: "processing", label: "Chờ xác nhận" },
  { key: "preparing", label: "Đang chuẩn bị" },
  { key: "shipping", label: "Đang giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã huỷ" },
];

const STATUS_TEXT = {
  processing: "Chờ xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

export default function RestaurantOrdersPage() {
  const navigate = useNavigate();

  // user restaurant hiện tại
  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const branchId = currentUser?.branchId || null;

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("processing");
  const [loading, setLoading] = useState(true);

  // ====== load orders theo chi nhánh hiện tại ======
  useEffect(() => {
    if (!branchId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const colRef = collection(db, "orders");
    const q = query(
      colRef,
      where("branchId", "==", branchId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => {
          const raw = d.data();
          const createdAt = raw.createdAt?.toDate?.() || new Date();
          const items = Array.isArray(raw.items) ? raw.items : [];

          const subtotal =
            typeof raw.subtotal === "number"
              ? raw.subtotal
              : items.reduce((s, it) => s + (Number(it.price) || 0), 0);

          const shippingFee =
            typeof raw.shippingFee === "number" ? raw.shippingFee : 0;

          return {
            id: d.id,
            items,
            status: (raw.status || "processing").toString().trim(),
            receiverName: raw.receiverName || "—",
            receiverPhone: raw.receiverPhone || "—",
            total:
              typeof raw.total === "number" ? raw.total : subtotal + shippingFee,
            createdAt,
          };
        });

        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Load restaurant orders error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [branchId]);

  // ====== đếm badge cho tab chờ xác nhận & đang chuẩn bị ======
  const statusCounts = useMemo(() => {
    const counter = {
      processing: 0,
      preparing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      const st = o.status;
      if (counter[st] !== undefined) counter[st] += 1;
    }
    return counter;
  }, [orders]);

  // ====== lọc theo tab ======
  const filteredOrders = useMemo(
    () => orders.filter((o) => o.status === activeTab),
    [orders, activeTab]
  );

  // ====== cập nhật trạng thái (chỉ tới shipping) ======
  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (err) {
      console.error("Update status error:", err);
      alert("Cập nhật trạng thái thất bại");
    }
  };

  const handleReject = (order) => {
    if (order.status !== "processing") return;
    const ok = window.confirm("Bạn chắc chắn muốn từ chối đơn này?");
    if (!ok) return;
    updateStatus(order.id, "cancelled");
  };

  const handleConfirm = (order) => {
    if (order.status !== "processing") return;
    updateStatus(order.id, "preparing");
  };

  const handleDeliver = (order) => {
    if (order.status !== "preparing") return;
    updateStatus(order.id, "shipping");
  };

  if (!branchId) {
    return (
      <div className="rest-orders-page">
        <p>Không tìm thấy chi nhánh cho tài khoản hiện tại.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rest-orders-page">
        <p>Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="rest-orders-page">
      {/* Tabs trạng thái */}
      <div className="rest-tabs">
        {STATUS_TABS.map((tab) => {
          const count = statusCounts[tab.key] || 0;
          const showBadge =
            (tab.key === "processing" || tab.key === "preparing") && count > 0;

          return (
            <button
              key={tab.key}
              type="button"
              className={
                "rest-tab-btn" +
                (activeTab === tab.key ? " rest-tab-btn--active" : "")
              }
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              {showBadge && <span className="rest-tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Bảng đơn hàng */}
      <section className="rest-orders-table-wrapper">
        <table className="rest-orders-table">
          <thead>
            <tr>
              <th className="col-code">Mã đơn</th>
              <th className="col-product">Sản phẩm</th>
              <th className="col-customer">Người đặt</th>
              <th className="col-phone">SĐT</th>
              <th className="col-total">Tổng tiền</th>
              <th className="col-actions">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="rest-empty-cell">
                  Không có đơn ở trạng thái này.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  {/* Mã đơn (bấm để xem chi tiết) */}
                  <td className="col-code">
                    <button
                      type="button"
                      className="code-link"
                      onClick={() =>
                        navigate(`/restaurant/orders/${order.id}`)
                      }
                    >
                      {order.id.slice(0, 5)}
                    </button>
                  </td>

                  {/* SẢN PHẨM: hiện TẤT CẢ món */}
                  <td className="col-product">
  <div className="product-cell">
    {Array.isArray(order.items) && order.items.length > 0 ? (
      order.items.map((item, idx) => (
        <div className="product-item" key={idx}>
          <img
            src={item.image || "https://via.placeholder.com/40?text=Food"}
            alt={item.name}
          />
          <div className="product-texts">
            <div className="product-name" title={item.name}>
              {item.name}
            </div>
            <div className="product-qty">x{item.quantity || 1}</div>
          </div>
        </div>
      ))
    ) : (
      <span>—</span>
    )}
  </div>
</td>

                  {/* Người đặt / SĐT */}
                  <td className="col-customer">{order.receiverName}</td>
                  <td className="col-phone">{order.receiverPhone}</td>

                  {/* Tổng tiền */}
                  <td className="col-total">
                    {(order.total || 0).toLocaleString("vi-VN")} đ
                  </td>

                  

                  {/* Thao tác */}
                  <td className="col-actions">
                    {order.status === "processing" && (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleReject(order)}
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirm(order)}
                        >
                          Xác nhận
                        </button>
                      </>
                    )}

                    {order.status === "preparing" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleDeliver(order)}
                      >
                        Giao hàng
                      </button>
                    )}
                    {/* Đang giao / hoàn thành / huỷ: không cho thao tác gì thêm */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

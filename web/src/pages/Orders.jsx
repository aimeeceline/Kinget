// src/pages/Orders/index.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@shared/FireBase";
import "./css/Orders.css";

const TABS = [
  { key: "processing", label: "Chờ xác nhận" },   // đổi từ pending -> processing
  { key: "preparing", label: "Đang chuẩn bị" },   // thêm
  { key: "shipping", label: "Đang giao" },        // hoặc dùng delivering cho giống app
  { key: "delivered", label: "Đã giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã huỷ" },
];

// để hiển thị chữ đẹp hơn
const statusText = {
    pending: "Chờ xác nhận",
    processing: "Đang chuẩn bị",
    shipping: "Đang giao",
    delivered: "Đã giao",
    completed: "Hoàn thành",
    cancelled: "Đã huỷ",
};

export default function OrdersPage() {
    // lấy user
    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    // ⚠️ chỗ này là ID để lọc đơn: ưu tiên phone
    const orderUserId = currentUser?.phone || currentUser?.id;

    const [activeTab, setActiveTab] = useState("processing");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // load đơn theo user
    useEffect(() => {
        if (!orderUserId) return;

        const colRef = collection(db, "orders");
        // nếu bạn muốn lấy tất cả rồi filter ở client thì bỏ cái where này,
        // nhưng để nhẹ thì mình where luôn
        const q = query(
            colRef,
            where("userId", "==", orderUserId),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const data = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                setOrders(data);
                setLoading(false);
            },
            (err) => {
                console.error("Load orders lỗi:", err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [orderUserId]);

    // lọc theo tab
    const filtered = useMemo(() => {
  return orders.filter((o) => (o.status || "processing") === activeTab);
}, [orders, activeTab]);

    if (!orderUserId) {
        return <p style={{ padding: 24 }}>Bạn cần đăng nhập để xem đơn hàng.</p>;
    }

    return (
        <div className="orders-page">
            <h1>Đơn hàng của bạn</h1>

            {/* TAB */}
            <div className="orders-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={
                            "orders-tab " + (activeTab === tab.key ? "orders-tab--active" : "")
                        }
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* LIST */}
            <div className="orders-list">
                {loading ? (
                    <p>Đang tải đơn hàng...</p>
                ) : filtered.length === 0 ? (
                    <p className="orders-empty">Không có đơn ở trạng thái này.</p>
                ) : (

                    filtered.map((order) => {
                        const items = Array.isArray(order.items) ? order.items : [];
                        const totalQty = items.reduce((sum, it) => sum + (it.quantity || 1), 0);

                        // lấy món đầu tiên để show
                        const firstItem = items[0];
                        const moreCount = items.length > 1 ? items.length - 1 : 0;

                        return (
                            <div key={order.id} className="order-card">
                                {/* HEADER */}
                                <div className="order-card__header">
                                    <div className="order-card__shop">
                                        <span className="order-card__tag">Mã đơn</span>
                                        <span className="order-card__title">
                                            #{(order.id || "").slice(0, 8).toUpperCase()}
                                        </span>
                                    </div>
                                    <div
                                        className={`order-card__status order-card__status--${order.status || "pending"
                                            }`}
                                    >
                                        {statusText[order.status || "pending"]}
                                    </div>
                                </div>

                                {/* BODY: chỉ 1 sản phẩm */}
                                <div className="order-card__body">
                                    {firstItem && (
                                        <div className="order-item">
                                            <img
                                                src={
                                                    firstItem.image ||
                                                    "https://via.placeholder.com/60?text=Food"
                                                }
                                                alt={firstItem.name}
                                            />
                                            <div className="order-item__info">
                                                <div className="order-item__name">{firstItem.name}</div>
                                                <div className="order-item__qty">
                                                    x{firstItem.quantity || 1}
                                                </div>
                                            </div>
                                            <div className="order-item__price">
                                                {(
                                                    (firstItem.price ||
                                                        firstItem.selectedSize?.price ||
                                                        0) * (firstItem.quantity || 1)
                                                ).toLocaleString("vi-VN")}
                                                đ
                                            </div>
                                        </div>
                                    )}

                                    {/* nếu còn sản phẩm khác thì báo */}
                                    {moreCount > 0 && (
                                        <div className="order-more">
                                            + {moreCount} sản phẩm khác
                                        </div>
                                    )}
                                </div>

                                {/* FOOTER */}
                                <div className="order-card__footer">
                                    <span>
                                        Tổng số tiền ({totalQty} sản phẩm):
                                    </span>
                                    <span className="order-card__total">
                                        {(order.total || 0).toLocaleString("vi-VN")}đ
                                    </span>
                                </div>

                                {/* ACTIONS */}
                                <div className="order-card__actions">
                                    <button
                                        className="order-view-btn"
                                        onClick={() => {
                                            // tuỳ bạn dùng react-router hay modal
                                            // ví dụ:
                                            window.location.href = `/orders/${order.id}`;
                                        }}
                                    >
                                        Xem chi tiết đơn hàng
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// src/pages/Orders/OrderDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrackingModal from "../components/TrackingModal";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@shared/FireBase";
import "./css/OrderDetail.css";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // user hiện tại
  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const currentUserId = currentUser?.phone || currentUser?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showTracking, setShowTracking] = useState(false);

  // ===== 1. listen đơn =====
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "orders", id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setOrder(null);
          setLoading(false);
          return;
        }
        const data = { id: snap.id, ...snap.data() };

        // chặn xem đơn của người khác
        if (currentUserId && data.userId && data.userId !== currentUserId) {
          setForbidden(true);
          setLoading(false);
          return;
        }

        const normalized = normalizeStatus(data.status);
        setOrder({ ...data, status: normalized });
        setLoading(false);
      },
      (err) => {
        console.error("listen order error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id, currentUserId]);

  // ===== 2. hủy đơn =====
  const handleCancel = async () => {
    if (!order) return;
    if (!(order.status === "processing" || order.status === "preparing")) {
      alert("Đơn này không thể hủy nữa.");
      return;
    }
    const ok = window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?");
    if (!ok) return;
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "cancelled",
      });
      alert("Đã hủy đơn hàng.");
    } catch (err) {
      console.error(err);
      alert("Hủy đơn thất bại.");
    }
  };

  // ===== 3. render điều kiện =====
  if (loading) {
    return <div className="odetail-page">Đang tải đơn hàng...</div>;
  }

  if (forbidden) {
    return (
      <div className="odetail-page">
        <p>Bạn không có quyền xem đơn này.</p>
        <button className="odetail-back" onClick={() => navigate("/orders")}>
          ← Quay lại đơn hàng
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="odetail-page">
        <p>Không tìm thấy đơn hàng.</p>
        <button className="odetail-back" onClick={() => navigate("/orders")}>
          ← Quay lại đơn hàng
        </button>
      </div>
    );
  }

  // ===== 4. tính toán =====
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = order.subtotal || 0;
  const shippingFee = order.shippingFee || 0;
  const total = order.total || subtotal + shippingFee;

  const canCancel =
    order.status === "processing" || order.status === "preparing";
  const canTrack = order.status === "shipping";

  // hiện nút theo dõi ngay trong box địa chỉ
  const canTrackHere =
    order.status === "shipping" &&
      order.delivery &&
    order.delivery.lat &&
    order.delivery.lng;

  return (
    <div className="odetail-page">
      {/* timeline */}
      <OrderTimeline status={order.status} createdAt={order.createdAt} />

      {/* Địa chỉ nhận hàng */}
      <div className="odetail-box">
        <h3 className="odetail-title">Địa chỉ nhận hàng</h3>
        <div className="odetail-address-top">
          <div>
            <div className="odetail-address-name">
              {order.receiverName || currentUser?.firstName || "Khách"}
              {order.receiverPhone ? ` (${order.receiverPhone})` : ""}
            </div>
            <div className="odetail-address-detail">
              {order.address || "—"}
            </div>
          </div>

          {canTrackHere && (
            <button
              className="odetail-track-inline"
              onClick={() => setShowTracking(true)}
            >
              Theo dõi drone
            </button>
          )}
        </div>
      </div>

      {/* Sản phẩm */}
      <div className="odetail-box">
        <h3 className="odetail-title">Sản phẩm</h3>
        <div className="odetail-items">
          {items.map((it, idx) => (
            <div key={idx} className="odetail-item">
              <img
                src={it.image || "https://via.placeholder.com/60?text=Food"}
                alt={it.name}
              />
              <div className="odetail-item-info">
                <div className="odetail-item-name">{it.name}</div>
                <div className="odetail-item-meta">
                  {it.selectedSize && <span>Size: {it.selectedSize.label}</span>}
                  {it.selectedBase && <span>Đế: {it.selectedBase.label}</span>}
                  {it.selectedTopping && (
                    <span>Topping: {it.selectedTopping.label}</span>
                  )}
                  {Array.isArray(it.selectedToppings) &&
                    it.selectedToppings.length > 0 && (
                      <span>
                        Topping:{" "}
                        {it.selectedToppings.map((t) => t.label).join(", ")}
                      </span>
                    )}
                  {it.note && <span>Ghi chú: {it.note}</span>}
                </div>
              </div>
              <div className="odetail-item-qty">x{it.quantity || 1}</div>
              <div className="odetail-item-price">
                {(
                  (it.price || it.selectedSize?.price || 0) *
                  (it.quantity || 1)
                ).toLocaleString("vi-VN")}
                đ
              </div>
            </div>
          ))}
        </div>

        <div className="odetail-line" />

        <div className="odetail-total-row">
          <span>Tổng tiền hàng</span>
          <span>{subtotal.toLocaleString("vi-VN")}đ</span>
        </div>
        <div className="odetail-total-row">
          <span>Phí vận chuyển</span>
          <span>{shippingFee.toLocaleString("vi-VN")}đ</span>
        </div>
        <div className="odetail-total-row odetail-total-row--big">
          <span>Tổng cộng</span>
          <span>{total.toLocaleString("vi-VN")}đ</span>
        </div>
      </div>

      {/* Thông tin đơn hàng */}
      <div className="odetail-box">
        <h3 className="odetail-title">
          <span className="odetail-icon-orange">🧾</span> Thông tin đơn hàng
        </h3>
        <div className="odetail-info-row">
          <span>Mã đơn hàng:</span>
          <span>#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="odetail-info-row">
          <span>Ngày đặt:</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="odetail-info-row">
          <span>Phương thức thanh toán:</span>
          <span>
            {order.paymentMethod === "cash"
              ? "Tiền mặt khi nhận hàng"
              : order.paymentMethod === "bank"
              ? "Chuyển khoản"
              : order.paymentMethod || "—"}
          </span>
        </div>
        <div className="odetail-info-row">
          <span>Hình thức giao hàng:</span>
          <span>
            {order.shippingMethod === "drone"
              ? "Giao bằng drone"
              : order.shippingMethod === "motorbike"
              ? "Giao bằng xe máy"
              : order.shippingMethod || "—"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <OrderActions
        canCancel={canCancel}
        canTrack={canTrack}
        onCancel={handleCancel}
        onTrack={() => setShowTracking(true)}
      />

      {/* Popup tracking */}
      {showTracking && (
        <TrackingModal
          order={order}
          onClose={() => setShowTracking(false)}
        />
      )}
    </div>
  );
}

/* ===== helpers ===== */
function normalizeStatus(status) {
  if (!status) return "processing";
  return status;
}

function formatDateTime(ts) {
  if (!ts?.toDate) return "—";
  const d = ts.toDate();
  const dd = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}

/* ===== timeline 4 trạng thái ===== */
function OrderTimeline({ status = "processing", createdAt }) {
  if (status === "cancelled") {
    return (
      <div className="odetail-box odetail-cancelled-box">
        <div className="odetail-cancelled-icon">⚠️</div>
        <div>
          <div className="odetail-cancelled-title">Đã hủy đơn hàng</div>
          <div className="odetail-cancelled-sub">
            Đơn hàng này đã được hủy. Nếu có thắc mắc hãy liên hệ lại cửa hàng.
          </div>
        </div>
      </div>
    );
  }

  let currentStep = 0;
  switch (status) {
    case "processing":
      currentStep = 0;
      break;
    case "preparing":
      currentStep = 1;
      break;
    case "shipping":
      currentStep = 2;
      break;
    case "delivered":
    case "completed":
      currentStep = 3;
      break;
    default:
      currentStep = 0;
  }

  const steps = ["Chờ xác nhận", "Đang chuẩn bị", "Đang giao", "Thành công"];

  return (
    <div className="odetail-timeline odetail-box">
      {steps.map((label, idx) => {
        const isActive = idx <= currentStep;
        const isLast = idx === steps.length - 1;
        return (
          <div key={label} className="odt-step">
            <div className={`odt-circle ${isActive ? "is-active" : ""}`}>
              {idx + 1}
            </div>
            {!isLast && (
              <div
                className={`odt-line ${idx < currentStep ? "is-active" : ""}`}
              />
            )}
            <div className="odt-label">{label}</div>
            {idx === 0 && (
              <div className="odt-time">{formatDateTime(createdAt)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== actions (hủy / theo dõi) ===== */
function OrderActions({ canCancel, canTrack, onCancel, onTrack }) {
  if (canTrack) {
    return (
      <div className="odetail-actions">
        <button className="odetail-track-btn" onClick={onTrack}>
          Theo dõi đơn hàng
        </button>
      </div>
    );
  }

  if (canCancel) {
    return (
      <div className="odetail-actions">
        <button className="odetail-cancel" onClick={onCancel}>
          Hủy đơn hàng
        </button>
      </div>
    );
  }

  return null;
}

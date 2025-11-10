import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../css/Restaurant/OrderDetail.css";

const STATUS_LABEL = {
  processing: "Chờ xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

export default function RestaurantOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // load đơn theo id
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "orders", id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          setOrder(null);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [id]);

  async function updateStatus(next) {
    if (!order) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: next,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Huỷ đơn này?")) return;
    await updateStatus("cancelled");
  }

  if (loading) return <div className="rod-wrap">Đang tải đơn…</div>;
  if (!order) return <div className="rod-wrap">Không tìm thấy đơn.</div>;

  const createdAt =
    order.createdAt?.toDate &&
    order.createdAt.toDate().toLocaleString("vi-VN");

  // các nút cho nhà hàng (tới shipping là dừng)
  let actionButtons = null;
  switch (order.status) {
    case "processing":
      actionButtons = (
        <>
          <button
            className="rod-btn rod-btn--primary"
            onClick={() => updateStatus("preparing")}
            disabled={saving}
          >
            Xác nhận đơn
          </button>
          <button
            className="rod-btn rod-btn--danger"
            onClick={handleCancel}
            disabled={saving}
          >
            Huỷ đơn
          </button>
        </>
      );
      break;
    case "preparing":
      actionButtons = (
        <button
          className="rod-btn rod-btn--primary"
          onClick={() => updateStatus("shipping")}
          disabled={saving}
        >
          Giao hàng
        </button>
      );
      break;
    // đang giao thì nhà hàng không làm gì nữa
    default:
      actionButtons = null;
  }

  return (
    <div className="rod-wrap">
      {/* top */}
      <div className="rod-topbar">
        <div className="rod-left">
         
          <div>
            <h1 className="rod-title">
              Đơn hàng: #{order.code || order.id.slice(0, 8)}
            </h1>
            <p className="rod-sub">
              Trạng thái:{" "}
              <span
                className={`rod-status rod-status--${order.status || "none"}`}
              >
                {STATUS_LABEL[order.status] || "Không xác định"}
              </span>
            </p>
            {createdAt && <p className="rod-sub">Tạo lúc: {createdAt}</p>}
          </div>
        </div>
        <div className="rod-actions">{actionButtons}</div>
      </div>

      {/* info box */}
      <div className="rod-box">
        <h2 className="rod-box-title">Thông tin khách</h2>
        <div className="rod-info-grid">
          <p>
            <span>Tên:</span> {order.receiverName || "Khách"}
          </p>
          <p>
            <span>SĐT:</span> {order.receiverPhone || "—"}
          </p>
          <p className="rod-info-full">
            <span>Địa chỉ:</span> {order.orderAddress || "—"}
          </p>
          
          <p>
            <span>Thanh toán:</span>{" "}
            {order.paymentMethod === "bank"
              ? "Chuyển khoản"
              : order.paymentMethod === "cash"
              ? "Tiền mặt"
              : "—"}
          </p>
        </div>
      </div>

      {/* items */}
      <div className="rod-box">
        <h2 className="rod-box-title">Món đã đặt</h2>
        {Array.isArray(order.items) && order.items.length > 0 ? (
          <table className="rod-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Hình</th>
                <th>Món</th>
                <th>SL</th>
                <th>Giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, idx) => {
                const qty = it.quantity || 1;
                const price = it.price || 0;
                const total = qty * price;
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <img
                        src={
                          it.image ||
                          it.img ||
                          "https://via.placeholder.com/48x48?text=Food"
                        }
                        alt={it.name}
                        className="rod-thumb"
                      />
                    </td>
                    <td>
                      <div className="rod-name">{it.name}</div>
                      {it.selectedSize ? (
                        <div className="rod-meta">
                          Size: {it.selectedSize.label}
                        </div>
                      ) : null}
                      {it.note ? (
                        <div className="rod-meta">Ghi chú: {it.note}</div>
                      ) : null}
                    </td>
                    <td>{qty}</td>
                    <td>{price.toLocaleString("vi-VN")}₫</td>
                    <td>{total.toLocaleString("vi-VN")}₫</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>Không có món.</p>
        )}
      </div>

      {/* total */}
      <div className="rod-box rod-totalbox">
        <div>
          <span>Tạm tính</span>
          <b>{(order.subtotal || 0).toLocaleString("vi-VN")}₫</b>
        </div>
        <div>
          <span>Phí giao</span>
          <b>{(order.shippingFee || 0).toLocaleString("vi-VN")}₫</b>
        </div>
        <div className="rod-grand">
          <span>Tổng thanh toán</span>
          <b>{(order.total || 0).toLocaleString("vi-VN")}₫</b>
        </div>
      </div>
    </div>
  );
}

// src/pages/Cart.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/cart.css";
import {
  listenCart,
  removeCartItem,
  updateCartQty,
  calcPrice as calcCartPrice,
} from "../services/cartClient";

export default function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const userStr =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id;

  // ===== realtime cart =====
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    const unsub = listenCart(userId, (data) => {
      setItems(data);
      // mặc định chọn tất cả item trong giỏ
      setSelectedIds(data.map((d) => d.cartDocId));
      setLoading(false);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [userId, navigate]);

  // chi nhánh hiện tại
  const currentBranchId = localStorage.getItem("selectedBranchId");
  const shownItems = currentBranchId
    ? items.filter((it) => it.branchId === currentBranchId)
    : items;

  // ⭐ selectedIds dùng cho toàn giỏ, nên tạo 1 bản "selected trong chi nhánh đang xem"
  const selectedVisibleIds = selectedIds.filter((id) =>
    shownItems.some((it) => it.cartDocId === id)
  );

  // ===== xoá =====
  const askDelete = (item) => {
    setDeleteTarget(item);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userId || !deleteTarget) {
      setConfirmOpen(false);
      return;
    }
    try {
      await removeCartItem(userId, deleteTarget.cartDocId);
    } catch (e) {
      console.error("Xoá Firestore lỗi:", e);
    }
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  // ===== tăng / giảm =====
  const handleChangeQty = async (cartDocId, newQty) => {
    if (!userId) return;
    if (newQty < 1) return;
    try {
      await updateCartQty(userId, cartDocId, newQty);
    } catch (e) {
      console.error(e);
    }
  };

  // tick / bỏ tick 1 món (theo toàn giỏ, nhưng click ở phần hiển thị)
  const toggleSelect = (cartDocId) => {
    setSelectedIds((prev) =>
      prev.includes(cartDocId)
        ? prev.filter((id) => id !== cartDocId)
        : [...prev, cartDocId]
    );
  };

  // tick all (chỉ tick những món đang hiển thị)
  const toggleSelectAll = () => {
    if (selectedVisibleIds.length === shownItems.length) {
      // bỏ tick hết món đang hiển thị
      setSelectedIds((prev) =>
        prev.filter(
          (id) => !shownItems.some((it) => it.cartDocId === id)
        )
      );
    } else {
      // tick tất cả món đang hiển thị + giữ nguyên mấy món branch khác
      setSelectedIds((prev) => [
        ...prev,
        ...shownItems
          .map((it) => it.cartDocId)
          .filter((id) => !prev.includes(id)),
      ]);
    }
  };

  // ⭐ tính tổng chỉ trên shownItems
  const total = shownItems.reduce((sum, it) => {
    if (!selectedIds.includes(it.cartDocId)) return sum;
    const line =
      typeof it._lineTotal === "number"
        ? it._lineTotal
        : (it.price || calcCartPrice(it)) * (it.quantity || 1);
    return sum + line;
  }, 0);

  // ⭐ tổng số lượng chỉ trên shownItems
  const totalSelectedQty = shownItems.reduce((sum, it) => {
    if (!selectedIds.includes(it.cartDocId)) return sum;
    const qty = typeof it.quantity === "number" ? it.quantity : 1;
    return sum + qty;
  }, 0);

  // helper topping
  const renderTopping = (it) => {
    if (it.selectedTopping && typeof it.selectedTopping === "object") {
      return <span>Topping: {it.selectedTopping.label}</span>;
    }
    if (it.selectedAddOn && typeof it.selectedAddOn === "object") {
      return <span>Thêm: {it.selectedAddOn.label}</span>;
    }
    return null;
  };

  if (!userId) return null;

  return (
    <div className="cart-page">
      <h1>Giỏ hàng</h1>

      {shownItems.length > 0 && (
        <div className="cart-select-all">
          <label className="ckb">
            <input
              type="checkbox"
              checked={selectedVisibleIds.length === shownItems.length}
              onChange={toggleSelectAll}
            />
            <span className="ckb-ui" /> Chọn tất cả
          </label>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : shownItems.length === 0 ? (
        <p>Giỏ hàng trống.</p>
      ) : (
        <div className="cart-list">
          {shownItems.map((it) => (
            <div key={it.cartDocId} className="cart-item">
              <label className="ckb cart-check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(it.cartDocId)}
                  onChange={() => toggleSelect(it.cartDocId)}
                />
                <span className="ckb-ui" />
              </label>

              <div className="cart-thumb">
                <img
                  src={it.image || "https://via.placeholder.com/80?text=Food"}
                  alt={it.name}
                />
              </div>

              <div className="cart-body">
                <h3>{it.name}</h3>
                <div className="cart-meta">
                  {it.selectedSize && (
                    <span>
                      Size: {it.selectedSize.label}{" "}
                      {it.selectedSize.price
                        ? `(${it.selectedSize.price.toLocaleString(
                            "vi-VN"
                          )} đ)`
                        : ""}
                    </span>
                  )}
                  {it.selectedBase && <span>Đế: {it.selectedBase.label}</span>}
                  {renderTopping(it)}
                  {it.note && <span>Ghi chú: {it.note}</span>}
                  {it.branchId && <span>CN: {it.branchId}</span>}
                </div>
              </div>

              <div className="cart-unit-price">
                {(it._unitPrice || it.price || 0).toLocaleString("vi-VN")} đ
              </div>

              <div className="cart-qty">
                <button
                  onClick={() =>
                    handleChangeQty(it.cartDocId, (it.quantity || 1) - 1)
                  }
                >
                  –
                </button>
                <input
                  type="number"
                  value={it.quantity || 1}
                  onChange={(e) =>
                    handleChangeQty(
                      it.cartDocId,
                      Number(e.target.value) || 1
                    )
                  }
                />
                <button
                  onClick={() =>
                    handleChangeQty(it.cartDocId, (it.quantity || 1) + 1)
                  }
                >
                  +
                </button>
              </div>

              <div className="cart-line-price">
                {(it._lineTotal ||
                  (it.price || 0) * (it.quantity || 1)
                ).toLocaleString("vi-VN")}{" "}
                đ
              </div>

              <button className="cart-delete" onClick={() => askDelete(it)}>
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}

      {/* footer */}
      <div className="cart-footer">
        <div className="cart-total-text">
          Tổng cộng: <strong>{total.toLocaleString("vi-VN")} đ</strong>
        </div>
        <button
          className="cart-checkout"
          disabled={selectedVisibleIds.length === 0}
          onClick={() =>
            navigate("/checkout", {
              state: {
                // ⭐ chỉ gửi những món đang hiển thị và được chọn
                selectedIds: selectedVisibleIds,
              },
            })
          }
        >
          Thanh toán ({totalSelectedQty})
        </button>
      </div>

      {/* popup xoá */}
      {confirmOpen && (
        <div className="cart-confirm-overlay">
          <div className="cart-confirm">
            <div className="cart-confirm-icon">!</div>
            <p>
              Bạn có muốn xoá{" "}
              <strong>{deleteTarget?.name || "món này"}</strong> khỏi giỏ hàng?
            </p>
            <div className="cart-confirm-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setConfirmOpen(false)}
              >
                Không
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDelete}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

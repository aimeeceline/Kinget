import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./css/cart.css";
import { db } from "@shared/FireBase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // popup xoá
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {cartDocId, name}

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id;

  // ===== lấy giỏ =====
  const fetchCart = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const cartRef = collection(db, "users", userId, "cart");
      const snap = await getDocs(cartRef);

      // 👇 giữ lại id document trong biến khác
      const data = snap.docs.map((d) => {
        const row = d.data();
        return {
          cartDocId: d.id, // id thực sự để update / delete
          ...row,
        };
      });

      setItems(data);
      setSelectedIds(data.map((d) => d.cartDocId));
    } catch (err) {
      console.error("Lỗi lấy giỏ:", err);
      setItems([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [userId, navigate, fetchCart]);

  // ===== mở popup xoá =====
  const askDelete = (item) => {
    setDeleteTarget(item);
    setConfirmOpen(true);
  };

  // ===== xác nhận xoá =====
  const handleConfirmDelete = async () => {
    if (!userId || !deleteTarget) {
      setConfirmOpen(false);
      return;
    }

    const docId = deleteTarget.cartDocId; // 👈 dùng id của document
    try {
      await deleteDoc(doc(db, "users", userId, "cart", docId));
    } catch (e) {
      console.error("Xoá Firestore lỗi:", e);
    }

    // cập nhật state
    setItems((prev) => prev.filter((it) => it.cartDocId !== docId));
    setSelectedIds((prev) => prev.filter((id) => id !== docId));

    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  // ===== tăng / giảm =====
  const handleChangeQty = async (cartDocId, newQty) => {
    if (!userId) return;
    if (newQty < 1) return;
    const ref = doc(db, "users", userId, "cart", cartDocId);
    await updateDoc(ref, { quantity: newQty });
    setItems((prev) =>
      prev.map((it) =>
        it.cartDocId === cartDocId ? { ...it, quantity: newQty } : it
      )
    );
  };

  // tick / bỏ tick 1 món
  const toggleSelect = (cartDocId) => {
    setSelectedIds((prev) =>
      prev.includes(cartDocId)
        ? prev.filter((id) => id !== cartDocId)
        : [...prev, cartDocId]
    );
  };

  // tick all
  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((it) => it.cartDocId));
    }
  };

  // tính tổng
  const total = items.reduce((sum, it) => {
    if (!selectedIds.includes(it.cartDocId)) return sum;
    const line = typeof it.price === "number" ? it.price : 0;
    const qty = typeof it.quantity === "number" ? it.quantity : 1;
    return sum + line * qty;
  }, 0);

  // helper topping
  const renderTopping = (it) => {
    if (Array.isArray(it.selectedToppings) && it.selectedToppings.length > 0) {
      return (
        <span>
          Topping: {it.selectedToppings.map((t) => t.label).join(", ")}
        </span>
      );
    }
    if (it.selectedTopping && typeof it.selectedTopping === "object") {
      return <span>Topping: {it.selectedTopping.label}</span>;
    }
    return null;
  };

  if (!userId) return null;

  return (
    <div className="cart-page">
      <h1>Giỏ hàng</h1>

      {items.length > 0 && (
        <div className="cart-select-all">
          <label className="ckb">
            <input
              type="checkbox"
              checked={selectedIds.length === items.length}
              onChange={toggleSelectAll}
            />
            <span className="ckb-ui" /> Chọn tất cả
          </label>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : items.length === 0 ? (
        <p>Giỏ hàng trống.</p>
      ) : (
        <div className="cart-list">
          {items.map((it) => (
            <div key={it.cartDocId} className="cart-item">
              {/* checkbox */}
              <label className="ckb cart-check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(it.cartDocId)}
                  onChange={() => toggleSelect(it.cartDocId)}
                />
                <span className="ckb-ui" />
              </label>

              {/* ảnh */}
              <div className="cart-thumb">
                <img
                  src={
                    it.image || "https://via.placeholder.com/80?text=Food"
                  }
                  alt={it.name}
                />
              </div>

              {/* nội dung */}
              <div className="cart-body">
                <h3>{it.name}</h3>
                <div className="cart-meta">
                  {it.selectedSize && (
                    <span>
                      Size: {it.selectedSize.label}{" "}
                      {it.selectedSize.price
                        ? `(${it.selectedSize.price.toLocaleString("vi-VN")} đ)`
                        : ""}
                    </span>
                  )}
                  {it.selectedBase && <span>Đế: {it.selectedBase.label}</span>}
                  {renderTopping(it)}
                  {it.note && <span>Ghi chú: {it.note}</span>}
                </div>
              </div>

              {/* đơn giá */}
              <div className="cart-unit-price">
                {(it.price || 0).toLocaleString("vi-VN")} đ
              </div>

              {/* qty */}
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

              {/* tổng dòng */}
              <div className="cart-line-price">
                {((it.price || 0) * (it.quantity || 1)).toLocaleString(
                  "vi-VN"
                )}{" "}
                đ
              </div>

              {/* nút xoá */}
              <button
                className="cart-delete"
                onClick={() => askDelete(it)}
              >
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
          disabled={selectedIds.length === 0}
          onClick={() =>
            navigate("/checkout", { state: { cartItemIds: selectedIds } })
          }
        >
          Thanh toán ({selectedIds.length})
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

// src/pages/Cart.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./css/cart.css";
import { db } from "@shared/FireBase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  calcPrice as calcCartPrice,
  removeCartItem,
  updateCartQty,
} from "../services/cartClient";

export default function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // popup xoá
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id;

  // ===== realtime cart =====
  const setupCartListener = useCallback(() => {
    if (!userId) return () => {};

    const cartRef = collection(db, "users", userId, "cart");

    const unsub = onSnapshot(
      cartRef,
      (snap) => {
        const data = snap.docs.map((d) => {
          const row = d.data();
          const qty =
            typeof row.quantity === "number" && row.quantity > 0
              ? row.quantity
              : 1;

          // nếu doc có price thì dùng luôn, nếu không thì tính lại
          const unit =
            typeof row.price === "number" ? row.price : calcCartPrice(row);

          return {
            cartDocId: d.id,
            ...row,
            quantity: qty,
            _unitPrice: unit,
            _lineTotal: unit * qty,
          };
        });

        setItems(data);
        setSelectedIds(data.map((d) => d.cartDocId));
        setLoading(false);
      },
      (err) => {
        console.error("Lỗi nghe giỏ:", err);
        setItems([]);
        setSelectedIds([]);
        setLoading(false);
      }
    );

    return unsub;
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    const unsub = setupCartListener();
    return () => {
      if (unsub) unsub();
    };
  }, [userId, navigate, setupCartListener]);

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
      // dùng service nếu thích
      await removeCartItem(userId, deleteTarget.cartDocId);
      // hoặc:
      // await deleteDoc(doc(db, "users", userId, "cart", deleteTarget.cartDocId));
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
      // không setState thủ công vì onSnapshot sẽ bắn lại
    } catch (e) {
      console.error(e);
    }
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
    const line =
      typeof it._lineTotal === "number"
        ? it._lineTotal
        : (it.price || 0) * (it.quantity || 1);
    return sum + line;
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
    if (it.selectedAddOn && typeof it.selectedAddOn === "object") {
      return <span>Topping: {it.selectedAddOn.label}</span>;
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
                  src={it.image || "https://via.placeholder.com/80?text=Food"}
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
                {(it._unitPrice || it.price || 0).toLocaleString("vi-VN")} đ
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
                {(it._lineTotal ||
                  (it.price || 0) * (it.quantity || 1)
                ).toLocaleString("vi-VN")}{" "}
                đ
              </div>

              {/* nút xoá */}
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
          disabled={selectedIds.length === 0}
          onClick={() => navigate("/checkout", { state: { selectedIds } })}
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

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

  // 👉 state theo dõi chi nhánh hiện tại
  const [branchId, setBranchId] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("selectedBranchId") || ""
      : ""
  );

  // ===== nghe event đổi chi nhánh từ Header =====
  useEffect(() => {
    const handleBranchChange = () => {
      const newId =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedBranchId") || ""
          : "";
      setBranchId(newId);
      setLoading(true); // chuẩn bị load giỏ mới
    };

    window.addEventListener("branch-changed", handleBranchChange);
    return () => {
      window.removeEventListener("branch-changed", handleBranchChange);
    };
  }, []);

  // ===== realtime cart (theo branch hiện tại) =====
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    // mỗi lần branchId đổi → nghe giỏ mới
    const unsub = listenCart(userId, (data) => {
      setItems(data);
      setSelectedIds(data.map((d) => d.cartDocId));
      setLoading(false);
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [userId, navigate, branchId]);

  // chi nhánh hiện tại
  const currentBranchId = branchId || (typeof window !== "undefined"
    ? localStorage.getItem("selectedBranchId")
    : null);

  const shownItems = currentBranchId
    ? items.filter((it) => it.branchId === currentBranchId)
    : items;

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

  const toggleSelect = (cartDocId) => {
    setSelectedIds((prev) =>
      prev.includes(cartDocId)
        ? prev.filter((id) => id !== cartDocId)
        : [...prev, cartDocId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVisibleIds.length === shownItems.length) {
      setSelectedIds((prev) =>
        prev.filter(
          (id) => !shownItems.some((it) => it.cartDocId === id)
        )
      );
    } else {
      setSelectedIds((prev) => [
        ...prev,
        ...shownItems
          .map((it) => it.cartDocId)
          .filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const total = shownItems.reduce((sum, it) => {
    if (!selectedIds.includes(it.cartDocId)) return sum;
    const line =
      typeof it._lineTotal === "number"
        ? it._lineTotal
        : (it.price || calcCartPrice(it)) * (it.quantity || 1);
    return sum + line;
  }, 0);

  const totalSelectedQty = shownItems.reduce((sum, it) => {
    if (!selectedIds.includes(it.cartDocId)) return sum;
    const qty = typeof it.quantity === "number" ? it.quantity : 1;
    return sum + qty;
  }, 0);

  // helper topping/addOn
  const renderTopping = (it) => {
    const toppings = Array.isArray(it.selectedTopping)
      ? it.selectedTopping
      : it.selectedTopping
      ? [it.selectedTopping]
      : [];

    const addOns = Array.isArray(it.selectedAddOn)
      ? it.selectedAddOn
      : it.selectedAddOn
      ? [it.selectedAddOn]
      : [];

    const parts = [];

    if (toppings.length > 0) {
      parts.push(
        `Topping: ${toppings
          .map((t) => t.label)
          .filter(Boolean)
          .join(", ")}`
      );
    }

    if (addOns.length > 0) {
      parts.push(
        `Thêm: ${addOns
          .map((a) => a.label)
          .filter(Boolean)
          .join(", ")}`
      );
    }

    if (parts.length === 0) return null;

    return <span>{parts.join(" | ")}</span>;
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
                  src={
                    it.image || "https://via.placeholder.com/80?text=Food"
                  }
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
                  {it.selectedBase && (
                    <span>Đế: {it.selectedBase.label}</span>
                  )}
                  {renderTopping(it)}
                  {it.note && <span>Ghi chú: {it.note}</span>}
                </div>
              </div>

              <div className="cart-unit-price">
                {(it._unitPrice || it.price || 0).toLocaleString(
                  "vi-VN"
                )}{" "}
                đ
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
                selectedIds: selectedVisibleIds,
              },
            })
          }
        >
          Thanh toán ({totalSelectedQty})
        </button>
      </div>

      {confirmOpen && (
        <div className="cart-confirm-overlay">
          <div className="cart-confirm">
            <div className="cart-confirm-icon">!</div>
            <p>
              Bạn có muốn xoá{" "}
              <strong>{deleteTarget?.name || "món này"}</strong> khỏi
              giỏ hàng?
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

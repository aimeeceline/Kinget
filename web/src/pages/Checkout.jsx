// src/pages/Checkout/index.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "@shared/FireBase";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import "./css/Checkout.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== 1. lấy state gửi từ Cart =====
  // Cart đang navigate("/checkout", { state: { selectedIds: [...] } })
  const selectedFromCart = Array.isArray(location.state?.selectedIds)
    ? location.state.selectedIds
    : [];
  const cameFromCart = selectedFromCart.length > 0;

  // ===== 2. user hiện tại =====
  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id;

  // ===== 3. state trong trang =====
  const [cartItems, setCartItems] = useState([]);     // toàn bộ giỏ trong Firestore
  const [selectedIds, setSelectedIds] = useState([]); // mấy món sẽ thanh toán
  const [shippingMethod, setShippingMethod] = useState("bike"); // bike | drone
  const [paymentMethod, setPaymentMethod] = useState("cod");    // cod | bank

  // ===== 4. load giỏ theo realtime =====
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const colRef = collection(db, "users", userId, "cart");
    const unsub = onSnapshot(colRef, (snap) => {
      const data = snap.docs.map((d) => ({
        cartId: d.id,
        ...d.data(),
      }));
      setCartItems(data);

      // 👇 quan trọng: quyết định chọn cái nào
      if (cameFromCart) {
        // chỉ giữ lại mấy id được gửi từ cart và vẫn còn trong giỏ
        const valid = selectedFromCart.filter((id) =>
          data.some((d) => d.cartId === id)
        );
        setSelectedIds(valid);
        console.log("[Checkout] ✅ nhận từ Cart:", valid);
      } else {
        // vào thẳng /checkout hoặc F5 -> chọn hết
        setSelectedIds(data.map((d) => d.cartId));
        console.log("[Checkout] ✅ không có state, chọn hết");
      }
    });

    return () => unsub();
  }, [userId, navigate, cameFromCart, selectedFromCart]);

  // ===== 5. tính toán =====
  const selectedItems = useMemo(() => {
    return cartItems.filter((it) => selectedIds.includes(it.cartId));
  }, [cartItems, selectedIds]);

  const subtotal = selectedItems.reduce((sum, it) => {
    const unit = typeof it.price === "number" ? it.price : 0;
    const qty = typeof it.quantity === "number" ? it.quantity : 1;
    return sum + unit * qty;
  }, 0);

  const shippingFee =
    selectedItems.length === 0
      ? 0
      : shippingMethod === "drone"
      ? 35000
      : 15000;

  const grandTotal = subtotal + shippingFee;

  // ===== 6. submit đơn hàng =====
  const handlePlaceOrder = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }
    if (selectedItems.length === 0) {
      alert("Không có món nào để đặt.");
      return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        userId,
        items: selectedItems,
        shippingMethod,
        paymentMethod,
        subtotal,
        shippingFee,
        total: grandTotal,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Đặt hàng thành công!");
      navigate("/"); // hoặc /orders
    } catch (err) {
      console.error("Đặt hàng lỗi:", err);
      alert("Đặt hàng thất bại");
    }
  };

  // ===== 7. nếu chưa login thì ko render =====
  if (!userId) return null;

  return (
    <div className="checkout-page">
      <h1>Thanh toán</h1>

      {/* ĐỊA CHỈ GIẢ */}
      <section className="ck-address">
        <div className="ck-address-left">
          <div className="ck-address-name">{currentUser?.firstName || "Khách"}</div>
          <div className="ck-address-detail">
            284 An Dương Vương, P.3, Q.5, TP.HCM
          </div>
        </div>
        <button
          type="button"
          className="ck-address-edit"
          onClick={() => alert("Làm màn hình chọn địa chỉ sau 😁")}
        >
          &gt;
        </button>
      </section>

      {/* DANH SÁCH MÓN */}
      <section className="ck-section">
        <h3>Danh sách món</h3>
        {selectedItems.length === 0 ? (
          <p>Không có món nào được chọn.</p>
        ) : (
          selectedItems.map((it) => (
            <div key={it.cartId} className="ck-item">
              <img
                src={
                  it.image ||
                  "https://via.placeholder.com/60?text=Food"
                }
                alt={it.name}
              />
              <div className="ck-item-info">
                <div className="ck-item-name">{it.name}</div>
                <div className="ck-item-meta">
                  {it.selectedSize && (
                    <span>
                      {it.selectedSize.label} (
                      {it.selectedSize.price
                        ? it.selectedSize.price.toLocaleString("vi-VN")
                        : 0}{" "}
                      đ)
                    </span>
                  )}
                  {it.selectedBase && (
                    <span>Đế: {it.selectedBase.label}</span>
                  )}
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
              <div className="ck-item-price">
                {(it.price || 0).toLocaleString("vi-VN")} đ
              </div>
              <div className="ck-item-qty">x{it.quantity || 1}</div>
            </div>
          ))
        )}
      </section>

      {/* PHƯƠNG THỨC VẬN CHUYỂN */}
      <section className="ck-section">
        <h3>Phương thức vận chuyển</h3>

        <div
          className={
            "ck-option " +
            (shippingMethod === "bike" ? "ck-option--active" : "")
          }
          onClick={() => setShippingMethod("bike")}
        >
          <span className="ck-option__icon">🚲</span>
          <span className="ck-option__title">Xe máy</span>
          {shippingMethod === "bike" && (
            <span className="ck-option__check">✔</span>
          )}
        </div>

        <div
          className={
            "ck-option " +
            (shippingMethod === "drone" ? "ck-option--active" : "")
          }
          onClick={() => setShippingMethod("drone")}
        >
          <span className="ck-option__icon">🛸</span>
          <span className="ck-option__title">Drone</span>
          {shippingMethod === "drone" && (
            <span className="ck-option__check">✔</span>
          )}
        </div>
      </section>

      {/* PHƯƠNG THỨC THANH TOÁN */}
      <section className="ck-section">
        <h3>Phương thức thanh toán</h3>

        <div
          className={
            "ck-option " + (paymentMethod === "cod" ? "ck-option--active" : "")
          }
          onClick={() => setPaymentMethod("cod")}
        >
          <span className="ck-option__icon">💵</span>
          <span className="ck-option__title">Tiền mặt</span>
          {paymentMethod === "cod" && (
            <span className="ck-option__check">✔</span>
          )}
        </div>

        <div
          className={
            "ck-option " + (paymentMethod === "bank" ? "ck-option--active" : "")
          }
          onClick={() => setPaymentMethod("bank")}
        >
          <span className="ck-option__icon">🏦</span>
          <span className="ck-option__title">Chuyển khoản</span>
          {paymentMethod === "bank" && (
            <span className="ck-option__check">✔</span>
          )}
        </div>
      </section>

      {/* TỔNG TIỀN + NÚT */}
      <section className="ck-summary">
        <div className="ck-summary-row">
          <span>Tạm tính</span>
          <span>{subtotal.toLocaleString("vi-VN")} đ</span>
        </div>
        <div className="ck-summary-row">
          <span>Phí giao</span>
          <span>{shippingFee.toLocaleString("vi-VN")} đ</span>
        </div>
        <div className="ck-summary-row ck-summary-total">
          <span>Tổng thanh toán</span>
          <span>{grandTotal.toLocaleString("vi-VN")} đ</span>
        </div>

        <button
          className="ck-submit"
          onClick={handlePlaceOrder}
          disabled={selectedItems.length === 0}
        >
          Đặt hàng ({selectedItems.length})
        </button>
      </section>
    </div>
  );
}

// src/pages/Checkout/index.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "@shared/FireBase";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { removeCartItem } from "../services/cartClient";
import "./css/Checkout.css";

// ⭐ toạ độ nhà hàng / kho giao hàng (ở Bùi Viện)
const RESTAURANT_LOCATION = {
  lat: 10.7672,
  lng: 106.6936,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== 1. lấy state gửi từ Cart =====
  const selectedFromCart = Array.isArray(location.state?.selectedIds)
    ? location.state.selectedIds
    : [];
  const cameFromCart = selectedFromCart.length > 0;

  // ===== 2. user hiện tại =====
  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id;
  const orderUserId = currentUser?.phone || currentUser?.id;

  // ===== 3. state trong trang =====
  const [cartItems, setCartItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [shippingMethod, setShippingMethod] = useState("bike"); // bike | drone (UI)
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod | bank (UI)
  const [address, setAddress] = useState(
    ""
  );
  const [address, setAddress] = useState("");
  const [receiverName, setReceiverName] = useState(
    currentUser?.firstName || "Khách"
  );
  const [receiverPhone, setReceiverPhone] = useState(
    currentUser?.phone || ""
  );

  // toạ độ giao cho khách
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);

  // chi nhánh đã chọn
  const [branchId, setBranchId] = useState(null);
  // toạ độ chi nhánh từ Firestore
  const [branchPos, setBranchPos] = useState(null);

  // ===== load sẵn từ localStorage =====
  useEffect(() => {
    const savedAddr = localStorage.getItem("deliveryAddress");
    const savedLat = localStorage.getItem("deliveryLat");
    const savedLng = localStorage.getItem("deliveryLng");
    const savedBranch = localStorage.getItem("selectedBranchId");

    if (savedAddr) setAddress(savedAddr);
    if (savedLat && savedLng) {
      setDeliveryLat(Number(savedLat));
      setDeliveryLng(Number(savedLng));
    }
    if (savedBranch) setBranchId(savedBranch);
  }, []);

  // ===== nếu có branchId thì lấy tọa độ chi nhánh từ Firestore =====
  useEffect(() => {
    async function fetchBranch() {
      if (!branchId) {
        setBranchPos(null);
        return;
      }
      const ref = doc(db, "branches", branchId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.lat === "number" && typeof data.lng === "number") {
          setBranchPos({ lat: data.lat, lng: data.lng });
        } else {
          setBranchPos(null);
        }
      } else {
        setBranchPos(null);
      }
    }
    fetchBranch();
  }, [branchId]);

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

      if (cameFromCart) {
        const valid = selectedFromCart.filter((id) =>
          data.some((d) => d.cartId === id)
        );
        setSelectedIds(valid);
      } else {
        // mặc định chọn hết
        setSelectedIds(data.map((d) => d.cartId));
      }
    });

    return () => unsub();
  }, [userId, navigate, cameFromCart, selectedFromCart]);

  // ===== 5. tính toán =====
  const selectedItems = useMemo(
    () => cartItems.filter((it) => selectedIds.includes(it.cartId)),
    [cartItems, selectedIds]
  );

  const subtotal = selectedItems.reduce((sum, it) => {
    const unit = typeof it.price === "number" ? it.price : 0;
    const qty = typeof it.quantity === "number" ? it.quantity : 1;
    return sum + unit * qty;
  }, 0);

  const shippingFee =
    selectedItems.length === 0
      ? 0
      : shippingMethod === "drone"
      ? 20000
      : 10000;

  const grandTotal = subtotal + shippingFee;

  // ===== helper: normalize item =====
  const normalizeOrderItem = (item) => {
    return {
      cartId: item.cartId,
      foodId: item.foodId || item.id,
      name: item.name,
      image: item.image || "",
      category: item.category || "",
      quantity: item.quantity || 1,
      price: item.price || 0,
      selectedSize: item.selectedSize ?? null,
      selectedBase: item.selectedBase ?? null,
      selectedTopping: item.selectedTopping ?? null,
      selectedAddOn: item.selectedAddOn ?? null,
      note: item.note ?? null,
      signature: item.signature || "",
      branchId: item.branchId || null,
    };
  };

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
    if (!receiverName.trim()) {
      alert("Vui lòng nhập tên người nhận.");
      return;
    }
    if (!receiverPhone.trim()) {
      alert("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!address.trim()) {
      alert("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }
    if (!branchId) {
      alert("Bạn chưa chọn chi nhánh.");
      return;
    }

    try {
      // map giá trị UI → giá trị app
      const shippingForDb = shippingMethod === "bike" ? "motorbike" : "drone";
      const paymentForDb = paymentMethod === "cod" ? "cash" : "bank";
      // map giá trị UI → giá trị lưu
      const shippingForDb =
        shippingMethod === "bike" ? "motorbike" : "drone";
      const paymentForDb =
        paymentMethod === "cod" ? "cash" : "bank";

      const normalizedItems = selectedItems.map((it) =>
        normalizeOrderItem(it)
      );

      // chuẩn bị toạ độ giao hàng
      let lat = deliveryLat;
      let lng = deliveryLng;

      // ===== chuẩn bị toạ độ giao hàng =====
      let lat = deliveryLat;
      let lng = deliveryLng;

      // nếu user không bấm "Lấy vị trí" mà chỉ nhập địa chỉ
      // thì thử geocode để lấy lat/lng
      if ((!lat || !lng) && address.trim()) {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address.trim()
          )}`
        );
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }
      }

      const deliveryObj = lat && lng ? { lat, lng } : null;

      // ⭐ tạo đơn
      // gói thành object (có thể null)
      const deliveryObj =
        lat && lng
          ? { lat, lng }
          : null;

      // ⭐ tạo đơn
      await addDoc(collection(db, "orders"), {
        userId: orderUserId,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        address: address.trim(),           // 👈 địa chỉ chữ (từ Nominatim hoặc user gõ)
        delivery:
          deliveryLat && deliveryLng
            ? { lat: deliveryLat, lng: deliveryLng }
            : null,                        // 👈 để màn tracking vẽ map
        orderAddress: address.trim(),
        address: address.trim(),

        // điểm giao khách
        delivery: deliveryObj,

        // chi nhánh (lấy từ localStorage)
        branchId: branchId,

        // điểm xuất phát / vị trí tài xế ban đầu = chi nhánh trong Firestore
        origin: branchPos
          ? { lat: branchPos.lat, lng: branchPos.lng }
          : null,
        currentPos: branchPos
          ? { lat: branchPos.lat, lng: branchPos.lng }
          : null,

        // ⭐ điểm xuất phát (nhà hàng)
        origin: {
          lat: RESTAURANT_LOCATION.lat,
          lng: RESTAURANT_LOCATION.lng,
        },

        // ⭐ vị trí hiện tại = nhà hàng (để tracking show ngay)
        currentPos: {
          lat: RESTAURANT_LOCATION.lat,
          lng: RESTAURANT_LOCATION.lng,
        },

        items: normalizedItems,
        shippingMethod: shippingForDb,
        paymentMethod: paymentForDb,
        shippingFee,
        subtotal,
        total: grandTotal,
        status: "preparing",
        createdAt: serverTimestamp(),
      });

      // xoá các item đã đặt khỏi giỏ
      await Promise.all(
        selectedItems.map((it) => removeCartItem(userId, it.cartId))
      );

      alert("Đặt hàng thành công!");
      navigate("/orders");
    } catch (err) {
      console.error("Đặt hàng lỗi:", err);
      alert("Đặt hàng thất bại");
    }
  };

  if (!userId) return null;

  return (
    <div className="checkout-page">
      <h1>Thanh toán</h1>

      {/* ĐỊA CHỈ */}
      <section className="ck-address">
        <div className="ck-address-left">
          <label className="ck-field">
            <span className="ck-field-label">Tên:</span>
            <input
              className="ck-address-input"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Tên người nhận"
            />
          </label>

          <label className="ck-field">
            <span className="ck-field-label">SĐT:</span>
            <input
              className="ck-address-input"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="Số điện thoại"
            />
          </label>

          <label className="ck-field">
            <span className="ck-field-label">Địa chỉ:</span>
            <input
              className="ck-address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Địa chỉ giao hàng"
            />
          </label>

          <button
            type="button"
            className="ck-map-btn"
            onClick={() => {
              if (!navigator.geolocation) {
                alert("Trình duyệt không hỗ trợ định vị");
                return;
              }

              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const { latitude, longitude } = pos.coords;
                  setDeliveryLat(latitude);
                  setDeliveryLng(longitude);

                  try {
                    const resp = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await resp.json();
                    if (data && data.display_name) {
                      setAddress(data.display_name);
                    } else {
                      setAddress(
                        `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                      );
                    }
                  } catch (err) {
                    console.error("Reverse geocode lỗi:", err);
                    setAddress(
                      `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    );
                  }
                },
                (err) => {
                  console.error(err);
                  alert("Không lấy được vị trí");
                }
              );
            }}
          >
            Lấy vị trí hiện tại
          </button>
        </div>

        <button
          type="button"
          className="ck-address-edit"
          onClick={() => {
            setReceiverName(currentUser?.firstName || "Khách");
            setReceiverPhone(currentUser?.phone || "");
            setAddress("284 An Dương Vương, P.3, Q.5, TP.HCM");
            setDeliveryLat(null);
            setDeliveryLng(null);
          }}
        >
          ↺
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
                src={it.image || "https://via.placeholder.com/60?text=Food"}
                alt={it.name}
              />
              <div className="ck-item-info">
                <div className="ck-item-name">{it.name}</div>
                <div className="ck-item-meta">
                  {it.selectedSize && (
                    <span>
                      {it.selectedSize.label} (
                      {(it.selectedSize.price || 0).toLocaleString("vi-VN")} đ)
                    </span>
                  )}
                  {it.selectedBase && <span>Đế: {it.selectedBase.label}</span>}
                  {it.selectedTopping && (
                    <span>Topping: {it.selectedTopping.label}</span>
                  )}
                  {it.selectedAddOn && (
                    <span>Thêm: {it.selectedAddOn.label}</span>
                  )}
                  {it.note && <span>Ghi chú: {it.note}</span>}
                  {it.branchId && <span>CN: {it.branchId}</span>}
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

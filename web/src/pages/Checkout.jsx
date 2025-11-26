// src/pages/Checkout.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "@shared/FireBase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  listenCart,
  removeCartItem,
  calcPrice as calcCartPrice,
} from "../services/cartClient";
import "./css/Checkout.css";

// 👇 map + leaflet
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ---------------- QR POPUP ----------------
function QRPopup({ open, onClose, amount, orderId }) {
  if (!open) return null;
  return (
    <div className="qr-overlay">
      <div className="qr-box">
        <h3>Quét mã để thanh toán</h3>
        {orderId ? <p>Đơn hàng: {orderId}</p> : null}
        {typeof amount === "number" ? (
          <p>Số tiền: {amount.toLocaleString("vi-VN")} đ</p>
        ) : null}

        <img
          src="/static/common/qr-demo.png"
          alt="QR thanh toán"
          className="qr-img"
        />

        <p style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
          Sau vài giây hệ thống sẽ chuyển sang trang xác nhận...
        </p>

        <button type="button" className="qr-close" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}

// icon mặc định của leaflet trong Vite hay lỗi, nên set tạm
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

function ClickToPick({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    },
  });
  return null;
}

// ====== build item giống APP ======
function buildOrderItem(item, branchIdFromPage) {
  // ưu tiên _unitPrice / price, fallback calc lại
  const unit =
    typeof item._unitPrice === "number"
      ? item._unitPrice
      : typeof item.price === "number" && item.price > 0
      ? item.price
      : calcCartPrice(item);

  return {
    // y chang app:
    branchId: item.branchId || branchIdFromPage || null,
    cartId: item.cartDocId || null, // vì listenCart trả cartDocId
    category: item.category || "",
    foodId: item.foodId || item.id || "",
    image: item.image || "",
    name: item.name || "",
    note: item.note || "",
    price: unit,
    quantity: item.quantity || 1,
    selectedAddOn: Array.isArray(item.selectedAddOn)
      ? item.selectedAddOn
      : item.selectedAddOn
      ? [item.selectedAddOn]
      : [],
    selectedBase: item.selectedBase ?? null,
    selectedSize: item.selectedSize ?? null,
    selectedTopping: Array.isArray(item.selectedTopping)
      ? item.selectedTopping
      : item.selectedTopping
      ? [item.selectedTopping]
      : [],
    signature: item.signature || "",
  };
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // selectedIds gửi từ Cart
  const selectedFromCart = Array.isArray(location.state?.selectedIds)
    ? location.state.selectedIds
    : [];
  const cameFromCart = selectedFromCart.length > 0;

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id; // ✅ đồng bộ với app: userId = user.id

  const [cartItems, setCartItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [shippingMethod, setShippingMethod] = useState("bike"); // UI: bike/drone
  const [paymentMethod, setPaymentMethod] = useState("cod"); // UI: cod/bank

  const [address, setAddress] = useState("");
  const [receiverName, setReceiverName] = useState(
    currentUser?.firstName || "Khách"
  );
  const [receiverPhone, setReceiverPhone] = useState(currentUser?.phone || "");

  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);

  const [branchId, setBranchId] = useState(null);
  const [branchPos, setBranchPos] = useState(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [mapCenter, setMapCenter] = useState([10.775, 106.7]); // tâm map
  const [searchQuery, setSearchQuery] = useState("");

  // QR
  const [showQR, setShowQR] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);

  // ----- load từ localStorage -----
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

  // ----- load tọa độ chi nhánh -----
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

  // ----- realtime cart (DÙNG listenCart GIỐNG CartPage) -----
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const unsub = listenCart(userId, (data) => {
      setCartItems(data);

      if (cameFromCart) {
        // selectedIds từ Cart là cartDocId
        const valid = selectedFromCart.filter((id) =>
          data.some((d) => d.cartDocId === id)
        );
        setSelectedIds(valid);
      } else {
        // mặc định chọn hết
        setSelectedIds(data.map((d) => d.cartDocId));
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [userId, navigate, cameFromCart, selectedFromCart]);

  // ----- tính toán -----=
  const selectedItems = useMemo(
    () => cartItems.filter((it) => selectedIds.includes(it.cartDocId)),
    [cartItems, selectedIds]
  );

  const subtotal = selectedItems.reduce((sum, it) => {
    const unit =
      typeof it._unitPrice === "number"
        ? it._unitPrice
        : typeof it.price === "number"
        ? it.price
        : calcCartPrice(it) || 0;
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

  const handlePlaceOrder = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }
    if (!branchId) {
      alert("Bạn chưa chọn chi nhánh.");
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

    try {
      // map UI → DB giống app
      const shippingForDb =
        shippingMethod === "bike" ? "motorbike" : "drone";
      const paymentForDb = paymentMethod === "cod" ? "cash" : "bank";

      // build items giống app
      const normalizedItems = selectedItems.map((it) =>
        buildOrderItem(it, branchId)
      );

      // tọa độ giao hàng
      let lat = deliveryLat;
      let lng = deliveryLng;

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

      // 👇 ORDER ROOT: giống app
      const orderRef = await addDoc(collection(db, "orders"), {
        branchId,
        userId: userId, // ✅ giống app: user.id
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        orderAddress: address.trim(),
        origin: branchPos ? { ...branchPos } : null,
        currentPos: branchPos ? { ...branchPos } : null,
        delivery: deliveryObj,
        paymentMethod: paymentForDb, // "cash" | "bank"
        shippingMethod: shippingForDb, // "motorbike" | "drone"
        shippingFee,
        subtotal,
        total: grandTotal,
        status: "processing",
        createdAt: serverTimestamp(),
        items: normalizedItems, // ✅ y chang app
      });

      // xoá món trong giỏ
      await Promise.all(
        selectedItems.map((it) => removeCartItem(userId, it.cartDocId))
      );

      const newOrderId = orderRef.id;

      // nếu là chuyển khoản → show QR rồi 5s chuyển trang
      if (paymentMethod === "bank") {
        setLastOrderId(newOrderId);
        setShowQR(true);

        setTimeout(() => {
          navigate("/message", {
            state: { orderId: newOrderId },
          });
        }, 5000);

        return;
      }

      // còn lại (COD)
      alert("Đặt hàng thành công!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Đặt hàng thất bại");
    }
  };

  if (!userId) return null;

  // ================== UI ==================
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
            />
          </label>
          <label className="ck-field">
            <span className="ck-field-label">SĐT:</span>
            <input
              className="ck-address-input"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
            />
          </label>

          <label className="ck-field" style={{ gap: 8 }}>
            <span className="ck-field-label">Địa chỉ:</span>
            <input
              className="ck-address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Địa chỉ giao hàng"
            />
            <button
              type="button"
              className="ck-map-btn"
              onClick={() => {
                if (deliveryLat && deliveryLng) {
                  setMapCenter([deliveryLat, deliveryLng]);
                } else if (branchPos) {
                  setMapCenter([branchPos.lat, branchPos.lng]);
                } else {
                  setMapCenter([10.775, 106.7]);
                }
                setShowAddressModal(true);
              }}
            >
              Chọn trên bản đồ
            </button>
          </label>
        </div>
      </section>

      {/* DANH SÁCH MÓN */}
      <section className="ck-section">
        <h3>Danh sách món</h3>
        {selectedItems.length === 0 ? (
          <p>Không có món nào được chọn.</p>
        ) : (
          selectedItems.map((it) => (
            <div key={it.cartDocId} className="ck-item">
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
                  {it.selectedBase && (
                    <span>Đế: {it.selectedBase.label}</span>
                  )}
                  {Array.isArray(it.selectedTopping) &&
                    it.selectedTopping.length > 0 && (
                      <span>
                        Topping:{" "}
                        {it.selectedTopping.map((t) => t.label).join(", ")}
                      </span>
                    )}
                  {Array.isArray(it.selectedAddOn) &&
                    it.selectedAddOn.length > 0 && (
                      <span>
                        Thêm:{" "}
                        {it.selectedAddOn.map((a) => a.label).join(", ")}
                      </span>
                    )}
                  {it.note && <span>Ghi chú: {it.note}</span>}
                  {it.branchId && <span>CN: {it.branchId}</span>}
                </div>
              </div>
              <div className="ck-item-price">
                {(it._unitPrice ||
                  it.price ||
                  calcCartPrice(it) ||
                  0
                ).toLocaleString("vi-VN")}{" "}
                đ
              </div>
              <div className="ck-item-qty">x{it.quantity || 1}</div>
            </div>
          ))
        )}
      </section>

      {/* SHIP */}
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

      {/* PAYMENT */}
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
            "ck-option " +
            (paymentMethod === "bank" ? "ck-option--active" : "")
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

      {/* SUMMARY */}
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

      {/* MODAL chọn địa chỉ giao khác */}
      {showAddressModal && (
        <div className="ck-modal-backdrop">
          <div className="ck-modal" style={{ width: 520 }}>
            <h3>Chọn địa chỉ giao</h3>

            {/* ô tìm kiếm địa chỉ */}
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập địa chỉ cần tìm..."
                style={{
                  flex: 1,
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                className="ck-map-btn"
                onClick={async () => {
                  const q = searchQuery.trim();
                  if (!q) return;
                  try {
                    const resp = await fetch(
                      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        q
                      )}`
                    );
                    const data = await resp.json();
                    if (Array.isArray(data) && data.length > 0) {
                      const lat = parseFloat(data[0].lat);
                      const lon = parseFloat(data[0].lon);

                      setDeliveryLat(lat);
                      setDeliveryLng(lon);
                      setAddress(data[0].display_name);
                      localStorage.setItem(
                        "deliveryAddress",
                        data[0].display_name
                      );
                      setMapCenter([lat, lon]);
                    } else {
                      alert("Không tìm thấy địa chỉ.");
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Tìm địa chỉ thất bại.");
                  }
                }}
              >
                Tìm
              </button>
            </div>

            {/* map */}
            <div className="ck-map-box" style={{ marginTop: 10 }}>
              <MapContainer
                center={mapCenter}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />

                <ClickToPick
                  onPick={async (latlng) => {
                    const { lat, lng } = latlng;
                    setDeliveryLat(lat);
                    setDeliveryLng(lng);
                    setMapCenter([lat, lng]);

                    try {
                      const resp = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                      );
                      const data = await resp.json();
                      const text =
                        data?.display_name ||
                        `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                      setAddress(text);
                      localStorage.setItem("deliveryAddress", text);
                    } catch (err) {
                      const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                      setAddress(text);
                      localStorage.setItem("deliveryAddress", text);
                    }
                  }}
                />

                {deliveryLat && deliveryLng && (
                  <Marker position={[deliveryLat, deliveryLng]} />
                )}
              </MapContainer>
            </div>

            <button
              type="button"
              className="ck-modal-close"
              onClick={() => setShowAddressModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* POPUP QR */}
      <QRPopup
        open={showQR}
        onClose={() => setShowQR(false)}
        amount={grandTotal}
        orderId={lastOrderId}
      />
    </div>
  );
}

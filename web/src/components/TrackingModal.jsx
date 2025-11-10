// src/components/TrackingModal.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const restaurantIcon = new L.Icon({
  iconUrl: "/static/common/restaurant.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
const customerIcon = new L.Icon({
  iconUrl: "/static/common/pin.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});
const droneIcon = new L.Icon({
  iconUrl: "/static/common/drone.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});
const bikeIcon = new L.Icon({
  iconUrl: "/static/common/honda.png",
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const DEFAULT_ORIGIN = { lat: 10.762622, lng: 106.660172 };

// tạo đường thẳng gồm nhiều điểm giữa origin và delivery
function makeStraightPath(origin, delivery, steps = 40) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin.lat + (delivery.lat - origin.lat) * t;
    const lng = origin.lng + (delivery.lng - origin.lng) * t;
    pts.push({ lat, lng });
  }
  return pts;
}

export default function TrackingModal({
  order,
  onClose,
  inline = false,
  onArrived,
}) {
  const hasDelivery = order?.delivery?.lat && order?.delivery?.lng;
  const origin = order?.origin?.lat ? order.origin : DEFAULT_ORIGIN;
  const isDrone = order?.shippingMethod === "drone";
  const isMotorbike = order?.shippingMethod === "motorbike";

  const initialCurrent =
    order?.currentPos?.lat && order?.currentPos?.lng
      ? order.currentPos
      : origin;

  const initialCenterRef = useRef(
    hasDelivery
      ? [order.delivery.lat, order.delivery.lng]
      : [origin.lat, origin.lng]
  );

  // đường cho xe máy (thẳng)
  const [bikePath, setBikePath] = useState([]);
  // vị trí marker
  const [movingPos, setMovingPos] = useState(initialCurrent);

  // để clear interval
  const timersRef = useRef([]);

  // ===== tạo đường cho xe máy (thẳng) =====
  useEffect(() => {
    if (!isMotorbike) return;
    if (!hasDelivery) return;
    const path = makeStraightPath(origin, order.delivery, 50);
    setBikePath(path);
  }, [isMotorbike, hasDelivery, origin, order]);

  // ===== animate drone =====
  useEffect(() => {
    if (!isDrone) return;
    if (!hasDelivery) return;

    const start = origin;
    const end = order.delivery;
    const steps = 40;
    let currentStep = 0;

    const tId = setInterval(() => {
      currentStep += 1;
      const t = currentStep / steps;
      const lat = start.lat + (end.lat - start.lat) * t;
      const lng = start.lng + (end.lng - start.lng) * t;
      setMovingPos({ lat, lng });

      if (currentStep >= steps) {
        clearInterval(tId);
        onArrived && onArrived();
      }
    }, 1000);

    timersRef.current.push(tId);

    return () => {
      timersRef.current.forEach((id) => clearInterval(id));
      timersRef.current = [];
    };
  }, [isDrone, hasDelivery, origin, order, onArrived]);

  // ===== animate motorbike =====
  useEffect(() => {
    if (!isMotorbike) return;
    if (!bikePath || bikePath.length === 0) return;

    let i = 0;
    const tId = setInterval(() => {
      i += 1;
      if (i >= bikePath.length) {
        clearInterval(tId);
        onArrived && onArrived();
        return;
      }
      const p = bikePath[i];
      setMovingPos({ lat: p.lat, lng: p.lng });
    }, 1000);

    timersRef.current.push(tId);

    return () => {
      clearInterval(tId);
    };
  }, [isMotorbike, bikePath, onArrived]);

  // ===== render map =====
  const mapContent = hasDelivery ? (
    <MapContainer
      center={initialCenterRef.current}
      zoom={14}
      style={{ height: "360px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* nhà hàng */}
      <Marker position={[origin.lat, origin.lng]} icon={restaurantIcon}>
        <Popup>Nhà hàng</Popup>
      </Marker>

      {/* khách */}
      <Marker
        position={[order.delivery.lat, order.delivery.lng]}
        icon={customerIcon}
      >
        <Popup>Khách hàng</Popup>
      </Marker>

      {/* marker di chuyển */}
      <Marker
        position={[movingPos.lat, movingPos.lng]}
        icon={isDrone ? droneIcon : bikeIcon}
      >
        <Popup>Đang giao</Popup>
      </Marker>

      {/* drone: line thẳng */}
      {isDrone && (
        <Polyline
          positions={[
            [origin.lat, origin.lng],
            [order.delivery.lat, order.delivery.lng],
          ]}
          pathOptions={{ color: "red" }}
        />
      )}

      {/* xe máy: line thẳng đã tạo */}
      {isMotorbike && bikePath.length > 0 && (
        <Polyline
          positions={bikePath.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: "#2563eb" }}
        />
      )}
    </MapContainer>
  ) : (
    <p>Đơn này chưa có vị trí giao để theo dõi.</p>
  );

  // ===== inline =====
  if (inline) {
    return (
      <div className="odetail-box">
        <h3 className="odetail-title">Theo dõi đơn hàng</h3>
        <div style={{ borderRadius: 10, overflow: "hidden" }}>{mapContent}</div>
        <p style={{ marginTop: 6, fontSize: 12, color: "#777" }}>
          Vị trí chỉ mang tính minh họa.
        </p>
      </div>
    );
  }

  // ===== popup =====
  return (
    <div className="odetail-modal-backdrop">
      <div className="odetail-modal">
        <div className="odetail-modal-header">
          <h3>Theo dõi đơn hàng</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="odetail-modal-body">{mapContent}</div>
      </div>
    </div>
  );
}

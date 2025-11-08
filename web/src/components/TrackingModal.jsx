// src/components/TrackingModal.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
// nếu bạn vẫn muốn thỉnh thoảng sync lên Firestore thì giữ 2 dòng này
// import { doc, updateDoc } from "firebase/firestore";
// import { db } from "@shared/FireBase";

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

/**
 * Lấy route từ leaflet-routing-machine rồi trả về cho cha
 * chỉ để LẤY DỮ LIỆU, không để nó tự vẽ marker
 */
function BikeRouteLoader({ origin, delivery, onRouteReady }) {
  const map = useMap();

  useEffect(() => {
    if (!origin || !delivery) return;

    const control = L.Routing.control({
      waypoints: [
        L.latLng(origin.lat, origin.lng),
        L.latLng(delivery.lat, delivery.lng),
      ],
      lineOptions: {
        styles: [{ color: "#2563eb", weight: 5 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      show: false,
      createMarker: () => null, // không vẽ 2 pin xanh
    }).addTo(map);

    control.on("routesfound", (e) => {
      const coords = e.routes[0].coordinates || [];
      // trả route về cho cha
      onRouteReady(coords);
    });

    return () => {
      map.removeControl(control);
    };
  }, [map, origin, delivery, onRouteReady]);

  return null;
}

export default function TrackingModal({ order, onClose }) {
  const hasDelivery = order?.delivery?.lat && order?.delivery?.lng;
  const origin = order?.origin?.lat ? order.origin : DEFAULT_ORIGIN;
  const isDrone = order?.shippingMethod === "drone";
  const isMotorbike = order?.shippingMethod === "motorbike";

  // vị trí hiện tại từ order (lần đầu mở modal)
  const initialCurrent =
    order?.currentPos?.lat && order?.currentPos?.lng
      ? order.currentPos
      : origin;

  // 👇 lưu center chỉ 1 lần để không bị reset zoom
  const initialCenterRef = useRef(
    hasDelivery
      ? [order.delivery.lat, order.delivery.lng]
      : [origin.lat, origin.lng]
  );

  // state để giữ route xe máy
  const [routeCoords, setRouteCoords] = useState([]);
  // state để giữ marker đang chạy (local, không đụng Firestore)
  const [movingPos, setMovingPos] = useState(initialCurrent);

  // khi đã có route thì animate local
  useEffect(() => {
    if (!isMotorbike) return;
    if (!routeCoords || routeCoords.length === 0) return;

    // tìm điểm gần nhất với vị trí hiện tại (để mở lại modal không chạy từ đầu)
    const cur = movingPos;
    let startIndex = 0;
    let minDist = Infinity;
    routeCoords.forEach((pt, idx) => {
      const d =
        (pt.lat - cur.lat) * (pt.lat - cur.lat) +
        (pt.lng - cur.lng) * (pt.lng - cur.lng);
      if (d < minDist) {
        minDist = d;
        startIndex = idx;
      }
    });

    let i = startIndex;
    const timer = setInterval(() => {
      i += 1;
      if (i >= routeCoords.length) {
        clearInterval(timer);
        return;
      }
      const point = routeCoords[i];
      setMovingPos({ lat: point.lat, lng: point.lng });

      // nếu muốn sync Firestore mỗi n bước thì mở phần này
      // if (i % 5 === 0) {
      //   updateDoc(doc(db, "orders", order.id), {
      //     currentPos: { lat: point.lat, lng: point.lng },
      //   });
      // }
    }, 2000); // 2s

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMotorbike, routeCoords]);

  return (
    <div className="odetail-modal-backdrop">
      <div className="odetail-modal">
        <div className="odetail-modal-header">
          <h3>Theo dõi đơn hàng</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="odetail-modal-body">
          {hasDelivery ? (
            <MapContainer
              center={initialCenterRef.current}
              zoom={14}
              style={{ height: "360px", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* nhà hàng */}
              <Marker
                position={[origin.lat, origin.lng]}
                icon={restaurantIcon}
              >
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
                position={[
                  (isMotorbike ? movingPos.lat : initialCurrent.lat),
                  (isMotorbike ? movingPos.lng : initialCurrent.lng),
                ]}
                icon={isDrone ? droneIcon : bikeIcon}
              >
                <Popup>Đang giao</Popup>
              </Marker>

              {/* drone → line thẳng */}
              {isDrone && (
                <Polyline
                  positions={[
                    [origin.lat, origin.lng],
                    [order.delivery.lat, order.delivery.lng],
                  ]}
                  pathOptions={{ color: "red" }}
                />
              )}

              {/* xe máy → vẽ line từ route để luôn thấy đường */}
              {isMotorbike && routeCoords.length > 0 && (
                <Polyline
                  positions={routeCoords.map((pt) => [pt.lat, pt.lng])}
                  pathOptions={{ color: "#2563eb" }}
                />
              )}

              {/* xe máy → chỉ load route 1 lần, không animate ở đây */}
              {isMotorbike && (
                <BikeRouteLoader
                  origin={origin}
                  delivery={order.delivery}
                  onRouteReady={setRouteCoords}
                />
              )}
            </MapContainer>
          ) : (
            <p>Đơn này chưa có vị trí giao để theo dõi.</p>
          )}
        </div>
      </div>
    </div>
  );
}

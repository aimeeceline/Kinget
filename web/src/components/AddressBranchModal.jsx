// src/components/AddressBranchModal.jsx
import { useEffect, useState } from "react";
import { db } from "@shared/FireBase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "./css/AddressBranchModal.css";

const defaultPos = [10.776889, 106.700806]; // HCM

const userMarker = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const branchMarker = new L.Icon({
  iconUrl: "static/common/restaurant.png",
  iconSize: [30, 50],
  iconAnchor: [15, 50],
});

function ClickToSelect({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// component nhỏ để điều hướng map khi chọn chi nhánh
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 0.5 });
    }
  }, [position, map]);
  return null;
}

export default function AddressBranchModal({ open, onClose }) {
  const [branches, setBranches] = useState([]);
  const [address, setAddress] = useState("");
  const [branchId, setBranchId] = useState("");
  const [pos, setPos] = useState(defaultPos);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [flyToPos, setFlyToPos] = useState(null);

  // load chi nhánh + dữ liệu cũ
  useEffect(() => {
    if (!open) return;
    (async () => {
      // chỉ lấy chi nhánh đang active
      const q = query(
        collection(db, "branches"),
        where("isActive", "==", true)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBranches(list);

      // lấy dữ liệu cũ trong localStorage
      const savedAddr = localStorage.getItem("deliveryAddress");
      const savedBranchId = localStorage.getItem("selectedBranchId");
      const savedLat = localStorage.getItem("deliveryLat");
      const savedLng = localStorage.getItem("deliveryLng");

      if (savedAddr) setAddress(savedAddr);

      // nếu branch cũ không còn trong danh sách active thì chọn cái đầu
      const stillExists =
        savedBranchId && list.some((b) => b.id === savedBranchId);

      if (stillExists) {
        setBranchId(savedBranchId);
      } else if (list.length > 0) {
        setBranchId(list[0].id);
      }

      // set vị trí
      if (savedLat && savedLng) {
        setPos([Number(savedLat), Number(savedLng)]);
      } else if (list[0]?.lat && list[0]?.lng) {
        setPos([list[0].lat, list[0].lng]);
      }
    })();
  }, [open]);

  // click map → chọn vị trí giao hàng + reverse address
  const handleSelectPos = async (newPos) => {
    setPos(newPos);
    try {
      setLoadingAddr(true);
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newPos[0]}&lon=${newPos[1]}`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "vi" },
      });
      const data = await res.json();
      if (data?.display_name) {
        setAddress(data.display_name);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingAddr(false);
    }
  };

  // nhập địa chỉ → bay đến
  const handleSearchAddress = async () => {
    if (!address) return;
    try {
      setLoadingAddr(true);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "vi" },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const newPos = [Number(item.lat), Number(item.lon)];
        setPos(newPos);
        setFlyToPos(newPos);
      } else {
        alert("Không tìm thấy địa chỉ.");
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingAddr(false);
    }
  };

  // lưu
  const handleSave = () => {
    if (!address) {
      alert("Nhập địa chỉ trước nha");
      return;
    }
    if (!branchId) {
      alert("Chọn chi nhánh nha");
      return;
    }

    // phòng trường hợp user cố sửa DOM chọn branch không active (unlikely)
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) {
      alert("Chi nhánh này hiện không hoạt động, chọn chi nhánh khác.");
      return;
    }

    localStorage.setItem("deliveryAddress", address);
    localStorage.setItem("selectedBranchId", branchId);
    localStorage.setItem("deliveryLat", String(pos[0]));
    localStorage.setItem("deliveryLng", String(pos[1]));
    localStorage.removeItem("needsAddressSetup");
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="kg-modal-backdrop">
      <div className="kg-modal">
        <h2 className="kg-modal-title">Chọn địa chỉ & chi nhánh</h2>

        {/* địa chỉ */}
        <label className="kg-field">
          <span>Địa chỉ giao hàng</span>
          <div className="kg-field-row">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, quận..."
            />
            <button
              type="button"
              onClick={handleSearchAddress}
              className="kg-btn-sm"
              disabled={loadingAddr}
            >
              Tìm
            </button>
          </div>
        </label>

        {/* chọn chi nhánh */}
        <label className="kg-field">
          <span>Chi nhánh</span>
          <select
            value={branchId}
            onChange={(e) => {
              const id = e.target.value;
              setBranchId(id);
              const b = branches.find((x) => x.id === id);
              if (b?.lat && b?.lng) {
                const newPos = [b.lat, b.lng];
                setPos(newPos);
                setFlyToPos(newPos);
              }
            }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.address ? `(${b.address})` : ""}
              </option>
            ))}
          </select>
        </label>

        {/* map */}
        <div className="kg-map">
          <MapContainer
            center={pos}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* marker vị trí giao hàng */}
            <Marker position={pos} icon={userMarker} />

            {/* marker chi nhánh active */}
            {branches
              .filter((b) => b.lat && b.lng)
              .map((b) => (
                <Marker
                  key={b.id}
                  position={[b.lat, b.lng]}
                  icon={branchMarker}
                  eventHandlers={{
                    click: () => {
                      setBranchId(b.id);
                      setPos([b.lat, b.lng]);
                    },
                  }}
                >
                  <Popup>
                    <strong>{b.name}</strong>
                    <br />
                    {b.address}
                    <br />
                    <button
                      onClick={() => {
                        setBranchId(b.id);
                        setPos([b.lat, b.lng]);
                      }}
                    >
                      Chọn chi nhánh này
                    </button>
                  </Popup>
                </Marker>
              ))}

            {flyToPos && <FlyTo position={flyToPos} />}
            <ClickToSelect onSelect={handleSelectPos} />
          </MapContainer>
        </div>

        <p className="kg-hint">
          Click bản đồ để đặt điểm giao. Click icon chi nhánh để chọn chi nhánh.
        </p>

        <div className="kg-actions">
          <button className="kg-btn kg-btn-primary" onClick={handleSave}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

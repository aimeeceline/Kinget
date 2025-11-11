import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../css/Admin/Drone.css";

const STATUS_LABEL = {
  idle: "Rảnh",
  flying: "Đang bay",
  maintenance: "Bảo trì",
};

export default function AdminDrones() {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const colRef = collection(db, "drones");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // sort theo code
        list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
        setDrones(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const toggleActive = async (dr) => {
    try {
      await updateDoc(doc(db, "drones", dr.id), {
        isActive: !dr.isActive,
      });
    } catch (e) {
      console.error(e);
      alert("Không cập nhật được trạng thái drone.");
    }
  };

  const statusText = (st) => STATUS_LABEL[st] || "—";

  return (
    <div className="ad-drone-page">
      <div className="ad-drone-head">
        <div>
          <h1 className="ad-drone-title">Quản lý drone</h1>
          <p className="ad-drone-sub">
            Theo dõi và bật/tắt các drone giao hàng.
          </p>
        </div>
        <button
          type="button"
          className="ad-drone-add"
          onClick={() => navigate("/admin/drones/new")}
        >
          + Thêm drone
        </button>
      </div>

      {loading ? (
        <p>Đang tải drone...</p>
      ) : drones.length === 0 ? (
        <p>Chưa có drone nào.</p>
      ) : (
        <table className="ad-drone-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên drone</th>
              <th>Chi nhánh</th>
              <th>Trạng thái bay</th>
              <th>Pin</th>
              <th>Hoạt động</th>
              <th style={{ width: 160 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {drones.map((dr) => (
              <tr key={dr.id}>
                <td>{dr.code || dr.id}</td>
                <td>{dr.name || "—"}</td>
                <td>{dr.branchId || "—"}</td>
                <td>
                  <span className={`ad-drone-status st-${dr.status || "na"}`}>
                    {statusText(dr.status)}
                  </span>
                </td>
                <td>
                  {typeof dr.battery === "number"
                    ? `${dr.battery}%`
                    : "—"}
                </td>
                <td>
                  <span
                    className={
                      dr.isActive ? "ad-drone-pill on" : "ad-drone-pill off"
                    }
                  >
                    {dr.isActive ? "Đang bật" : "Đang tắt"}
                  </span>
                </td>
                <td>
                  <div className="ad-drone-actions">
                    <button
                      type="button"
                      className="ad-drone-edit"
                      onClick={() => navigate(`/admin/drones/${dr.id}/edit`)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className={
                        dr.isActive
                          ? "ad-drone-toggle danger"
                          : "ad-drone-toggle"
                      }
                      onClick={() => toggleActive(dr)}
                    >
                      {dr.isActive ? "Khóa" : "Mở"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

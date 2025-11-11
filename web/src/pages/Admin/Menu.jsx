import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../css/Admin/Menu.css";

const PAGE_SIZE = 5;

export default function AdminFoods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const colRef = collection(db, "foods");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // sort tên
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setFoods(list);
        setLoading(false);
        setPage(1);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const categories = useMemo(() => {
    const s = new Set();
    foods.forEach((f) => f.category && s.add(f.category));
    return Array.from(s);
  }, [foods]);

  // lọc theo danh mục + theo trạng thái
  const filtered = foods.filter((f) => {
    if (catFilter !== "all" && f.category !== catFilter) return false;
    if (onlyActive && f.isActive === false) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const currentData = filtered.slice(start, start + PAGE_SIZE);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const getDefaultPrice = (food) => {
    if (Array.isArray(food.sizes) && food.sizes.length > 0) {
      return food.sizes[0].price || 0;
    }
    return food.price || 0;
  };

  const toggleActive = async (food) => {
    try {
      await updateDoc(doc(db, "foods", food.id), {
        isActive: !food.isActive,
      });
    } catch (e) {
      console.error(e);
      alert("Không cập nhật được trạng thái món.");
    }
  };

  return (
    <div className="ad-foods-page">
      <div className="ad-foods-head">
        <div>
          <h1 className="ad-foods-title">Quản lý món ăn</h1>
        </div>
        <div className="ad-foods-head-right">
          <label className="ad-foods-filter">
            Danh mục:
            <select
              value={catFilter}
              onChange={(e) => {
                setCatFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="ad-foods-filter" style={{ gap: 4 }}>
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => {
                setOnlyActive(e.target.checked);
                setPage(1);
              }}
            />
            Chỉ món đang bán
          </label>

          <button
            type="button"
            className="ad-add-btn"
            onClick={() => navigate("/admin/foods/new")}
          >
            + Thêm món
          </button>
        </div>
      </div>

      {loading ? (
        <p>Đang tải món...</p>
      ) : filtered.length === 0 ? (
        <p>Không có món trong danh mục này.</p>
      ) : (
        <>
          <table className="ad-foods-table pretty">
            <thead>
              <tr>
                <th>Mã SP</th>
                <th>Ảnh</th>
                <th>Tên SP</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((f) => {
                const price = getDefaultPrice(f);
                return (
                  <tr key={f.id}>
                    <td>{f.code || f.id}</td>
                    <td>
                      <div className="ad-img-box">
                        <img
                          src={
                            f.image ||
                            "https://via.placeholder.com/80x80?text=Food"
                          }
                          alt={f.name}
                        />
                      </div>
                    </td>
                    <td className="ad-food-name-cell">{f.name}</td>
                    <td>{f.category || "—"}</td>
                    <td>{price.toLocaleString("vi-VN")}đ</td>
                    <td>
                      <span
                        className={
                          f.isActive ? "ad-pill active" : "ad-pill inactive"
                        }
                      >
                        {f.isActive ? "Đang bán" : "Tạm dừng"}
                      </span>
                    </td>
                    <td>
                      <div className="ad-row-actions">
                        <button
                          type="button"
                          className="ad-edit-btn"
                          onClick={() =>
                            navigate(`/admin/foods/${f.id}/edit`)
                          }
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className={
                            f.isActive ? "ad-toggle-btn danger" : "ad-toggle-btn"
                          }
                          onClick={() => toggleActive(f)}
                        >
                          {f.isActive ? "Khóa" : "Mở"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="ad-foods-pagination">
            <button onClick={() => goPage(page - 1)} disabled={page === 1}>
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={p === page ? "active" : ""}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
            >
              »
            </button>
          </div>
        </>
      )}
    </div>
  );
}

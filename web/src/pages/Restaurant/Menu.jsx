import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import "../../pages/css/Restaurant/Menu.css";

const PAGE_SIZE = 5; // muốn 5 hay 10 thì đổi ở đây

export default function RestaurantMenu() {
  const { user } = useAuthContext();
  const branchId = user?.branchId || user?.restaurantBranchId || "";
  const [branchFoods, setBranchFoods] = useState([]);
  const [foodsMaster, setFoodsMaster] = useState({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState("");
  const [page, setPage] = useState(1);

  // nghe subcollection branchFoods của chi nhánh
  useEffect(() => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    const ref = collection(db, "branches", branchId, "branchFoods");
    const unsub = onSnapshot(
      query(ref),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setBranchFoods(list);
        setLoading(false);
        setPage(1); // về trang 1 khi dữ liệu đổi
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [branchId]);

  // load bảng foods tổng
  useEffect(() => {
    async function loadFoods() {
      const snap = await getDocs(collection(db, "foods"));
      const map = {};
      snap.forEach((d) => {
        map[d.id] = { id: d.id, ...d.data() };
      });
      setFoodsMaster(map);
    }
    loadFoods();
  }, []);

  const handleToggle = async (row) => {
    if (!branchId) return;

    // nếu món gốc đã khóa thì không cho mở bên chi nhánh
    const master = foodsMaster[row.foodId];
    if (master && master.isActive === false) {
      alert("Món này đã bị admin khóa ở hệ thống, chi nhánh không thể mở.");
      return;
    }

    setToggling(row.branchFoodId);
    try {
      const ref = doc(
        db,
        "branches",
        branchId,
        "branchFoods",
        row.branchFoodId
      );
      await updateDoc(ref, {
        isActive: !row.isActive,
      });
    } catch (e) {
      console.error(e);
      alert("Đổi trạng thái thất bại");
    } finally {
      setToggling("");
    }
  };

  // gộp lại để render
  // QUAN TRỌNG: ẩn luôn những branchFoods mà món gốc (foods) đang isActive === false
  const mergedRows = branchFoods
    .map((bf) => {
      const food = foodsMaster[bf.foodId] || {};

      const sizePrice =
        Array.isArray(food.sizes) && food.sizes.length > 0
          ? food.sizes[0].price || 0
          : null;
      const displayPrice =
        typeof sizePrice === "number" ? sizePrice : food.price || 0;

      return {
        branchFoodId: bf.id,
        foodId: bf.foodId,
        isActive: bf.isActive,
        // trạng thái món gốc
        globalActive: food.isActive !== false, // undefined hoặc true → true
        code: food.code || bf.foodId,
        name: food.name || `Món ${bf.foodId}`,
        category: food.category || "—",
        price: displayPrice,
        image:
          food.image ||
          food.img ||
          "https://via.placeholder.com/70x90?text=Food",
      };
    })
    // FILTER ở đây: chỉ hiển thị nếu món gốc vẫn active
    .filter((r) => r.globalActive);

  // phân trang
  const totalPages =
    mergedRows.length === 0 ? 1 : Math.ceil(mergedRows.length / PAGE_SIZE);

  const start = (page - 1) * PAGE_SIZE;
  const currentRows = mergedRows.slice(start, start + PAGE_SIZE);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="rest-menu-wrap">
      <div className="rest-menu-tablewrap">
        {loading ? (
          <p>Đang tải...</p>
        ) : mergedRows.length === 0 ? (
          <p>Chưa có món khả dụng (có thể admin đã khóa món ở hệ thống).</p>
        ) : (
          <>
            <table className="rest-menu-table">
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
                {currentRows.map((r) => (
                  <tr key={r.branchFoodId}>
                    <td>{r.code}</td>
                    <td>
                      <img
                        src={r.image}
                        alt={r.name}
                        className="rest-menu-img"
                      />
                    </td>
                    <td>{r.name}</td>
                    <td>{r.category}</td>
                    <td>{r.price.toLocaleString("vi-VN")}đ</td>
                    <td>
                      <span
                        className={
                          "rest-menu-status " +
                          (r.isActive ? "active" : "inactive")
                        }
                      >
                        {r.isActive ? "Đang bán" : "Tạm dừng"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={
                          "rest-btn " + (r.isActive ? "lock" : "open")
                        }
                        onClick={() => handleToggle(r)}
                        disabled={toggling === r.branchFoodId}
                      >
                        {toggling === r.branchFoodId
                          ? "Đang đổi..."
                          : r.isActive
                          ? "Khoá"
                          : "Mở"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* pagination */}
            <div className="rest-menu-pagination">
              <button
                type="button"
                onClick={() => goPage(page - 1)}
                disabled={page === 1}
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === page ? "active" : ""}
                  onClick={() => goPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goPage(page + 1)}
                disabled={page === totalPages}
              >
                »
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

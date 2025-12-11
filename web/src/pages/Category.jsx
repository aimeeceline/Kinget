// src/pages/Category.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";
import {
  getFoodsByCategory,
  getFoodsByCategoryForBranch,
} from "../services/foodService";

const CAT_MAP = {
  pizza: { name: "Pizza" },
  burger: { name: "Burger" },
  drink: { name: "Drink" },
};

export default function Category() {
  const { slug } = useParams();
  const cat = CAT_MAP[slug];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👉 state theo dõi branchId
  const [branchId, setBranchId] = useState(
    localStorage.getItem("selectedBranchId") || ""
  );

  if (!cat) return <div style={{ padding: 16 }}>Danh mục không tồn tại.</div>;

  // ====== LẤY DỮ LIỆU MỖI KHI CATEGORY HOẶC BRANCH ĐỔI ======
  useEffect(() => {
    let stop = false;

    async function load() {
      setLoading(true);

      const userStr = localStorage.getItem("user");
      const hasUser = !!userStr;

      try {
        // TH1: không login → lấy toàn bộ món theo category
        if (!hasUser) {
          const data = await getFoodsByCategory(cat.name);
          if (!stop) setItems(data);
          return;
        }

        // TH2: có login nhưng chưa chọn chi nhánh → lấy tất cả
        if (!branchId) {
          const data = await getFoodsByCategory(cat.name);
          if (!stop) setItems(data);
          return;
        }

        // TH3: có login + có chi nhánh → lọc theo chi nhánh
        const data = await getFoodsByCategoryForBranch(branchId, cat.name);
        if (!stop) setItems(data);

      } finally {
        if (!stop) setLoading(false);
      }
    }

    load();
    return () => { stop = true };
  }, [slug, cat.name, branchId]); // 👈 thêm branchId


  // ====== NGHE EVENT "branch-changed" TỪ HEADER ======
  useEffect(() => {
    const handleBranchChange = () => {
      const newId = localStorage.getItem("selectedBranchId") || "";
      setBranchId(newId); // branchId đổi → load() chạy lại
    };

    window.addEventListener("branch-changed", handleBranchChange);
    return () =>
      window.removeEventListener("branch-changed", handleBranchChange);
  }, []);


  return (
    <section>
      <h1 style={{ marginBottom: 16, marginLeft: 90 }}>{cat.name}</h1>
      {loading ? (
        <ProductList limit={6} />
      ) : (
        <ProductList items={items} maxWidth="1180px" />
      )}
    </section>
  );
}

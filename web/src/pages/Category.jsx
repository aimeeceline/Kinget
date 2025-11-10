// src/pages/Category.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";
import {
  getFoodsByCategory,
  getFoodsByCategoryForBranch,
} from "../services/foodService"; // 👈 import thêm getFoodsByCategory

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

  if (!cat) return <div style={{ padding: 16 }}>Danh mục không tồn tại.</div>;

  useEffect(() => {
    let stop = false;

    async function load() {
      setLoading(true);

      // lấy user và chi nhánh (nếu có)
      const userStr = localStorage.getItem("user");
      const hasUser = !!userStr;
      const branchId = localStorage.getItem("selectedBranchId");

      try {
        // TH1: không đăng nhập -> lấy tất cả món theo category
        if (!hasUser) {
          const data = await getFoodsByCategory(cat.name);
          if (!stop) setItems(data);
          return;
        }

        // TH2: có đăng nhập mà chưa chọn chi nhánh -> cũng lấy tất cả
        if (!branchId) {
          const data = await getFoodsByCategory(cat.name);
          if (!stop) setItems(data);
          return;
        }

        // TH3: có đăng nhập + có chi nhánh -> lọc theo chi nhánh
        const data = await getFoodsByCategoryForBranch(branchId, cat.name);
        if (!stop) setItems(data);
      } finally {
          if (!stop) setLoading(false);
      }
    }

    load();
    return () => {
      stop = true;
    };
  }, [slug, cat.name]);

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

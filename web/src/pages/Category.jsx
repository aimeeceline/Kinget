// src/pages/Category.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";
import { getFoodsByCategoryForBranch } from "../services/foodService"; // 👈 dùng service

const CAT_MAP = {
  pizza:  { name: "Pizza" },
  burger: { name: "Burger" },
  drink:  { name: "Drink" },
};

export default function Category() {
  const { slug } = useParams();
  const cat = CAT_MAP[slug];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchMissing, setBranchMissing] = useState(false);

  if (!cat) return <div style={{ padding: 16 }}>Danh mục không tồn tại.</div>;

  useEffect(() => {
    let stop = false;

    async function load() {
      setLoading(true);
      setBranchMissing(false);

      // lấy chi nhánh đang chọn
      const branchId = localStorage.getItem("selectedBranchId");
      if (!branchId) {
        setBranchMissing(true);
        setLoading(false);
        return;
      }

      try {
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

  if (branchMissing) {
    return (
      <section style={{ padding: 16 }}>
        <h2>{cat.name}</h2>
        <p>Vui lòng chọn chi nhánh trước.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 style={{ marginBottom: 16 }}>{cat.name}</h2>
      {loading ? (
        <ProductList limit={6} />
      ) : (
        <ProductList items={items} maxWidth="1180px" />
      )}
    </section>
  );
}

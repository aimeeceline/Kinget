// src/pages/Category.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@shared/FireBase";
import ProductList from "../components/ProductList";

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

  if (!cat) return <div style={{ padding: 16 }}>Danh mục không tồn tại.</div>;

  useEffect(() => {
    let stop = false;
    async function load() {
      setLoading(true);
      try {
        const q = query(
  collection(db, "foods"),
  where("category", "==", slug.charAt(0).toUpperCase() + slug.slice(1))
);
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!stop) setItems(list);
      } finally {
        if (!stop) setLoading(false);
      }
    }
    load();
    return () => { stop = true; };
  }, [slug]);

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

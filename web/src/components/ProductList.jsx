// src/components/ProductList.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "./ProductCard";
import "./css/ProductList.css";
import { db } from "@shared/FireBase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

/**
 * Props:
 * - title?: string
 * - limit?: number (mặc định 8)
 * - categorySlug?: string
 * - maxWidth?: string | number
 * - items?: array  👈 nếu truyền vào thì không fetch
 * - onAdd?: (product) => void   👈 thêm
 */
export default function ProductList({
  title,
  limit = 8,
  categorySlug: slugProp,
  maxWidth,
  items: itemsProp,
  onAdd,                       // 👈 thêm
}) {
  const { slug: slugFromRoute } = useParams();
  const categorySlug = (slugProp || slugFromRoute || "").trim();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👉 nếu đã truyền items từ ngoài thì KHÔNG fetch nữa
  useEffect(() => {
    if (Array.isArray(itemsProp)) {
      setItems(limit ? itemsProp.slice(0, limit) : itemsProp);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);

      try {
        const colRef = collection(db, "foods");

        let snap;
        if (categorySlug) {
          const qCat = query(colRef, where("category", "==", categorySlug));
          snap = await getDocs(qCat);
        } else {
          snap = await getDocs(colRef);
        }

        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (!cancelled) {
          setItems(limit ? data.slice(0, limit) : data);
        }
      } catch (err) {
        console.error("Lỗi lấy foods từ Firestore:", err);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [categorySlug, limit, itemsProp]);

  return (
    <section
      className="pl-wrap"
      style={maxWidth ? { maxWidth, margin: "0 auto" } : undefined}
    >
      {title && (
        <div className="pl-head">
          <h2>{title}</h2>
        </div>
      )}

      <div className="pl-grid">
        {loading
          ? Array.from({ length: limit || 8 }).map((_, i) => (
              <div className="pl-skeleton" key={i}>
                <div className="pl-sk-thumb" />
                <div className="pl-sk-line" />
                <div className="pl-sk-line short" />
              </div>
            ))
          : items.length > 0
          ? items.map((p, i) => (
              <ProductCard
                key={p.id ?? p._id ?? `${p.name ?? p.title ?? "item"}-${i}`}
                product={p}
                onAdd={onAdd}       
              />
            ))
          : <div className="pl-empty">Chưa có sản phẩm.</div>}
      </div>
    </section>
  );
}

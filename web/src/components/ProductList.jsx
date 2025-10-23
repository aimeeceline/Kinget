import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "./ProductCard";
import "./ProductList.css";

// map slug -> categoryId khớp db.json của bạn
const SLUG_TO_ID = { combo: 1, pasta: 2, pizza: 3, salad: 4, drink: 5 };

/**
 * Props:
 * - title?: string
 * - limit?: number (mặc định 8)
 * - categorySlug?: string (nếu không truyền sẽ lấy từ route /menu/:slug)
 */
export default function ProductList({ title, limit = 8, categorySlug: slugProp }) {
  const { slug: slugFromRoute } = useParams();
  const categorySlug = (slugProp || slugFromRoute || "").trim();

  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastTried, setLastTried] = useState("");
  const [error, setError] = useState("");

  // build query: _limit + (optional) categoryId
  const query = useMemo(() => {
    const qs = new URLSearchParams();
    if (limit > 0) qs.set("_limit", String(limit));
    if (categorySlug) {
      const cid = SLUG_TO_ID[categorySlug];
      if (cid != null) qs.set("categoryId", String(cid));
    }
    return qs.toString();
  }, [limit, categorySlug]);

  // Thử nhiều URL theo thứ tự (đảm bảo vẫn chạy được kể cả proxy /api hỏng):
  // 1) thẳng 4000 /products -> 2) proxy /products -> 3) thẳng 4000 /product -> 4) proxy /product
  const urls = useMemo(() => {
    const u = query ? `?${query}` : "";
    return [
      `http://localhost:4000/api/products`,
      `/api/products`,
      `http://localhost:4000/api/product}`,
      `/api/product`,
    ];
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setItems([]);

    (async () => {
      for (const url of urls) {
        try {
          setLastTried(url);
          const r = await fetch(url);
          const raw = await r.text();        // đọc thô để phát hiện bị trả HTML
          let data = null;
          try { data = JSON.parse(raw); } catch {}

          if (!r.ok) continue;
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : null);
          if (!arr) continue;

          if (!cancelled) {
            setItems(arr);
            setLoading(false);
          }
          return;
        } catch {
          // thử URL tiếp theo
        }
      }
      if (!cancelled) {
        setError("Không đọc được JSON từ API (có thể backend trả trang HTML hoặc proxy sai).");
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [urls]);

  return (
    <section className="pl-wrap">
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
              />
            ))
          : <div className="pl-empty">Chưa có sản phẩm.</div>}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import "./MiniCart.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const USER_ID = 1; // tạm thời fix, sau này lấy từ auth

function money(n) {
  return (n || 0).toLocaleString("vi-VN") + " vnđ";
}

export default function MiniCart() {
  const [cart, setCart] = useState(null);
  const [productsById, setProductsById] = useState({});
  const [loading, setLoading] = useState(true);

  // tải giỏ + join thông tin sản phẩm
  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}/carts?userId=${USER_ID}`);
      const arr = await r.json();
      const c = arr[0];
      if (!c) {
        setCart({ id: null, userId: USER_ID, items: [] });
        setProductsById({});
        return;
      }
      setCart(c);

      const ids = (c.items || []).map(it => it.productId);
      if (ids.length) {
        const qs = ids.map(id => `id=${id}`).join("&");
        const p = await fetch(`${API}/products?${qs}`).then(r => r.json());
        const map = Object.fromEntries(p.map(x => [x.id, x]));
        setProductsById(map);
      } else {
        setProductsById({});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // nghe sự kiện “cart:changed” để tự refresh
    const onChanged = () => load();
    window.addEventListener("cart:changed", onChanged);
    return () => window.removeEventListener("cart:changed", onChanged);
  }, []);

  const items = useMemo(() => cart?.items || [], [cart]);
  const total = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (it.price || productsById[it.productId]?.price || 0) * it.qty,
        0
      ),
    [items, productsById]
  );

  const patchCart = async (nextItems) => {
    if (!cart?.id) {
      // nếu chưa có cart -> tạo mới
      const created = await fetch(`${API}/carts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, items: nextItems }),
      }).then(r => r.json());
      setCart(created);
    } else {
      const updated = await fetch(`${API}/carts/${cart.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: nextItems }),
      }).then(r => r.json());
      setCart(updated);
    }
    // thông báo toàn app
    window.dispatchEvent(new Event("cart:changed"));
  };

  const inc = (pid) => {
    const next = items.map(it => it.productId === pid ? { ...it, qty: it.qty + 1 } : it);
    patchCart(next);
  };
  const dec = (pid) => {
    const next = items
      .map(it => it.productId === pid ? { ...it, qty: Math.max(1, it.qty - 1) } : it);
    patchCart(next);
  };
  const removeItem = (pid) => {
    const next = items.filter(it => it.productId !== pid);
    patchCart(next);
  };

  if (loading) return (
    <aside className="mini-cart">
      <div className="mini-cart__title">Giỏ hàng của tôi</div>
      <div className="mini-cart__empty">Đang tải…</div>
    </aside>
  );

  return (
    <aside className="mini-cart" aria-live="polite">
      <div className="mini-cart__title">Giỏ hàng của tôi</div>

      {!items.length ? (
        <div className="mini-cart__empty">Chưa có sản phẩm.</div>
      ) : (
        <ul className="mini-cart__list">
          {items.map(it => {
            const p = productsById[it.productId] || {};
            const linePrice = (it.price || p.price || 0) * it.qty;
            return (
              <li key={it.productId} className="mini-cart__row">
                <img className="mini-cart__thumb" src={p.thumbnail} alt="" />
                <div className="mini-cart__meta">
                  <div className="mini-cart__name">{p.name || `ID ${it.productId}`}</div>
                  <div className="mini-cart__qty">
                    <button onClick={() => dec(it.productId)} aria-label="Giảm">−</button>
                    <span>{it.qty}</span>
                    <button onClick={() => inc(it.productId)} aria-label="Tăng">＋</button>
                  </div>
                </div>
                <div className="mini-cart__price">{money(linePrice)}</div>
                <button className="mini-cart__remove" onClick={() => removeItem(it.productId)} aria-label="Xóa">×</button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mini-cart__footer">
        <div className="mini-cart__total">
          <span>Tổng cộng</span>
          <strong>{money(total)}</strong>
        </div>
        <button className="mini-cart__checkout" disabled={!items.length}>
          Xem giỏ hàng
        </button>
      </div>
    </aside>
  );
}

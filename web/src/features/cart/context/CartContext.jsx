import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

/** ===== Helpers ===== */
const LS_KEY = "cart.v1";

function parsePrice(p) {
  // chấp nhận "32.000", "32,000", "32000", 32000
  if (typeof p === "number") return p;
  if (!p) return 0;
  const s = String(p).replace(/[^\d]/g, "");
  return Number(s || 0);
}

/** ===== Reducer ===== */
function reducer(state, action) {
  switch (action.type) {
    case "INIT": {
      return action.payload || { items: [] };
    }
    case "ADD": {
      const { item, qty = 1 } = action;
      if (!item || item.id == null) return state;

      const items = [...state.items];
      const i = items.findIndex((x) => x.id === item.id);
      if (i >= 0) {
        items[i] = { ...items[i], qty: items[i].qty + qty };
      } else {
        items.push({
          id: item.id,
          name: item.name || item.title || "Sản phẩm",
          price: parsePrice(item.price),
          image: item.image || item.img || "",
          qty,
        });
      }
      return { ...state, items };
    }
    case "INC": {
      const items = state.items.map((x) =>
        x.id === action.id ? { ...x, qty: x.qty + 1 } : x
      );
      return { ...state, items };
    }
    case "DEC": {
      const items = state.items
        .map((x) =>
          x.id === action.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x
        );
      return { ...state, items };
    }
    case "SET_QTY": {
      const qty = Math.max(1, Number(action.qty) || 1);
      const items = state.items.map((x) =>
        x.id === action.id ? { ...x, qty } : x
      );
      return { ...state, items };
    }
    case "REMOVE": {
      const items = state.items.filter((x) => x.id !== action.id);
      return { ...state, items };
    }
    case "CLEAR": {
      return { items: [] };
    }
    default:
      return state;
  }
}

/** ===== Context ===== */
const CartContext = createContext(null);

export function CartProvider({ children }) {
  // khởi tạo từ localStorage
  const [state, dispatch] = useReducer(reducer, { items: [] }, (init) => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : init;
    } catch {
      return init;
    }
  });

  // persist mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  // selector & actions
  const api = useMemo(() => {
    const items = state.items;
    const count = items.reduce((s, x) => s + x.qty, 0);
    const subtotal = items.reduce((s, x) => s + x.qty * parsePrice(x.price), 0);

    return {
      // state
      items,
      count,                 // tổng số món (qty)
      itemCount: items.length, // số dòng hàng
      subtotal,              // tổng tiền chưa phí khác

      // actions
      add: (item, qty = 1) => dispatch({ type: "ADD", item, qty }),
      inc: (id) => dispatch({ type: "INC", id }),
      dec: (id) => dispatch({ type: "DEC", id }),
      setQty: (id, qty) => dispatch({ type: "SET_QTY", id, qty }),
      remove: (id) => dispatch({ type: "REMOVE", id }),
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [state]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải được dùng bên trong <CartProvider>");
  return ctx;
}

// src/pages/ProductDetail.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./css/ProductDetail.css";

import { db } from "@shared/FireBase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import QuantityInput from "../components/QuantityInput";
import ProductList from "../components/ProductList";
import { addToCart } from "../services/cartClient";

// ===== helpers =====
const pickFirst = (arr) =>
  Array.isArray(arr) && arr.length > 0 ? arr[0] : null;

// tính giá hiện tại để show trên nút
function calcCurrentPrice(product, selectedSize, selectedExtra, selectedBase) {
  let price = 0;

  // 1. base
  if (selectedSize && typeof selectedSize.price === "number") {
    price = selectedSize.price;
  } else if (typeof product.price === "number") {
    price = product.price;
  } else if (Array.isArray(product.sizes) && product.sizes[0]) {
    price = product.sizes[0].price || 0;
  }

  // 2. base pizza/burger
  if (selectedBase && typeof selectedBase.price === "number") {
    price += selectedBase.price;
  }

  // 3. topping/addOn
  if (selectedExtra && typeof selectedExtra.price === "number") {
    price += selectedExtra.price;
  }

  return price;
}

function shuffle(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // selections
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedExtra, setSelectedExtra] = useState(null);
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  // suggestions
  const [suggested, setSuggested] = useState([]);

  // user
  const userStr =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id;

  // ===== load product + gợi ý =====
  useEffect(() => {
    let alive = true;

    async function loadProduct() {
      setLoading(true);
      try {
        // 1) lấy món chính
        const ref = doc(db, "foods", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (alive) {
            setProduct(null);
            setLoading(false);
          }
          return;
        }
        const data = { id: snap.id, ...snap.data() };

        const defSize = pickFirst(data.sizes);
        const defBase = pickFirst(data.bases);

        if (alive) {
          setProduct(data);
          setSelectedSize(defSize);
          setSelectedBase(defBase);
          setSelectedExtra(null);
          setQty(1);
        }

        // 2) gợi ý
        const foodsCol = collection(db, "foods");
        const allSnap = await getDocs(foodsCol);
        const allFoods = allSnap.docs
          .filter((d) => d.id !== data.id)
          .map((d) => ({ id: d.id, ...d.data() }));
        const random4 = shuffle(allFoods).slice(0, 4);
        if (alive) setSuggested(random4);
      } catch (err) {
        console.error("Lỗi load product detail:", err);
        if (alive) {
          setProduct(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      alive = false;
    };
  }, [id]);

  // phân biệt topping vs addOn
  const extraMeta = useMemo(() => {
    if (!product) return { type: "none", list: [] };
    if (Array.isArray(product.toppings) && product.toppings.length > 0) {
      return { type: "topping", list: product.toppings };
    }
    if (Array.isArray(product.addOns) && product.addOns.length > 0) {
      return { type: "addon", list: product.addOns };
    }
    return { type: "none", list: [] };
  }, [product]);

  const unitPrice = product
    ? calcCurrentPrice(product, selectedSize, selectedExtra, selectedBase)
    : 0;

  // ===== add to cart =====
  const handleAddToCart = async () => {
    if (!product) return;

    if (!userId) {
      alert("Bạn cần đăng nhập trước nha ✋");
      navigate("/login");
      return;
    }

    // lấy chi nhánh hiện tại
    const branchId =
      typeof window !== "undefined"
        ? localStorage.getItem("selectedBranchId")
        : null;

    if (!branchId) {
      alert("Bạn chưa chọn chi nhánh. Vui lòng chọn chi nhánh trước.");
      return;
    }

    const isAddOn = extraMeta.type === "addon";

    try {
      const result = await addToCart(userId, product, {
        selectedSize: selectedSize || null,
        selectedBase: selectedBase || null,
        selectedTopping: !isAddOn ? selectedExtra || null : null,
        selectedAddOn: isAddOn ? selectedExtra || null : null,
        note: note || "",
        quantity: qty,
        branchId, // 👈 thêm vào đây
      });

      if (result?.merged) {
        alert("Đã cộng thêm vào món có sẵn trong giỏ ✅");
      } else {
        alert("Đã thêm vào giỏ ✅");
      }
    } catch (err) {
      console.error(err);
      alert("Không thêm được vào giỏ 😢");
    }
  };

  if (loading) {
    return <div className="pd-page">Đang tải món ăn.</div>;
  }

  if (!product) {
    return <div className="pd-page">Không tìm thấy món ăn.</div>;
  }

  return (
    <div className="pd-page">
      <div className="pd-content">
        <div className="pd-left">
          <img
            src={
              product.image ||
              product.imageUrl ||
              "https://via.placeholder.com/500?text=No+Image"
            }
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/500?text=No+Image";
            }}
          />
        </div>

        <div className="pd-right">
          <h1>{product.name}</h1>
          <p className="pd-desc">
            {product.description || "Món này chưa có mô tả chi tiết."}
          </p>

          {/* chọn size */}
          {Array.isArray(product.sizes) && product.sizes.length > 0 && (
            <div className="pd-group">
              <h3>Chọn kích cỡ</h3>
              <div className="pd-options">
                {product.sizes.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className={selectedSize?.label === s.label ? "active" : ""}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s.label}{" "}
                    {s.price ? s.price.toLocaleString("vi-VN") + " đ" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* chọn đế */}
          {Array.isArray(product.bases) && product.bases.length > 0 && (
            <div className="pd-group">
              <h3>Chọn đế bánh</h3>
              <div className="pd-options">
                {product.bases.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    className={selectedBase?.label === b.label ? "active" : ""}
                    onClick={() => setSelectedBase(b)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* topping / addOns */}
          {extraMeta.list.length > 0 && (
            <div className="pd-group">
              <h3>Tùy chọn thêm</h3>
              <div className="pd-options">
                {extraMeta.list.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className={selectedExtra?.label === opt.label ? "active" : ""}
                    onClick={() =>
                      setSelectedExtra(
                        selectedExtra?.label === opt.label ? null : opt
                      )
                    }
                  >
                    {opt.label}{" "}
                    {opt.price
                      ? "+" + opt.price.toLocaleString("vi-VN") + " đ"
                      : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ghi chú */}
          <div className="pd-group">
            <h3>Ghi chú</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: ít cay, thêm phô mai…"
            />
          </div>

          {/* hàng quantity + pill */}
          <div className="pd-actions-row">
            <QuantityInput value={qty} min={1} onChange={setQty} />

            <div className="pd-price-pill">
              <div className="pd-price-pill__price">
                {(unitPrice * qty).toLocaleString("vi-VN")} đ
              </div>
              <button
                type="button"
                className="pd-price-pill__btn"
                onClick={handleAddToCart}
              >
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* gợi ý */}
      {suggested.length > 0 && (
        <div className="pd-related">
          <ProductList title="Món gợi ý" items={suggested} limit={4} />
        </div>
      )}
    </div>
  );
}

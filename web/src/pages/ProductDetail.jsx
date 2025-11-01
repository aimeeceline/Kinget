// src/pages/ProductDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    doc,
    getDoc,
    collection,
    getDocs,
} from "firebase/firestore";
import { db } from "@shared/FireBase";

import QuantityInput from "../components/QuantityInput";
import ProductList from "../components/ProductList";
import { addToCart } from "../services/cartClient";

import "./css/ProductDetail.css";

// chỉ để hiển thị giá
function calcCurrentPrice(product, size, topping) {
    let price = 0;

    if (size?.price != null) {
        price = size.price;
    } else if (typeof product.price === "number") {
        price = product.price;
    } else if (Array.isArray(product.sizes) && product.sizes[0]?.price != null) {
        price = product.sizes[0].price;
    }

    if (Array.isArray(topping)) {
        topping.forEach((t) => {
            if (typeof t.price === "number") price += t.price;
        });
    } else if (topping?.price != null) {
        price += topping.price;
    }

    return price;
}

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // lựa chọn
    const [qty, setQty] = useState(1);
    const [size, setSize] = useState(null);
    const [base, setBase] = useState(null);
    const [topping, setTopping] = useState(null);
    const [note, setNote] = useState("");

    // gợi ý (random)
    const [related, setRelated] = useState([]);

    // user
    const userStr =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const userId = currentUser?.id;

    // load product + random 4 món
    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            try {
                // 1. lấy món chi tiết
                const ref = doc(db, "foods", id);
                const snap = await getDoc(ref);
                if (!snap.exists()) {
                    if (alive) setProduct(null);
                    return;
                }

                const data = { id: snap.id, ...snap.data() };
                if (alive) {
                    setProduct(data);

                    // set default
                    if (Array.isArray(data.sizes) && data.sizes.length > 0) {
                        setSize(data.sizes[0]);
                    } else {
                        setSize(null);
                    }

                    if (Array.isArray(data.bases) && data.bases.length > 0) {
                        setBase(data.bases[0]);
                    } else {
                        setBase(null);
                    }

                    if (Array.isArray(data.toppings) && data.toppings.length > 0) {
                        setTopping(null);
                    } else {
                        setTopping(null);
                    }
                }

                // 2. lấy hết món để random
                const allSnap = await getDocs(collection(db, "foods"));
                const allFoods = allSnap.docs
                    .map((d) => ({ id: d.id, ...d.data() }))
                    // loại chính nó
                    .filter((f) => f.id !== data.id);

                // random 4 cái
                const shuffled = allFoods.sort(() => 0.5 - Math.random()).slice(0, 4);

                if (alive) {
                    setRelated(shuffled);
                }
            } catch (err) {
                console.error("Lỗi lấy product detail:", err);
                if (alive) {
                    setProduct(null);
                    setRelated([]);
                }
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [id]);

    const handleAddToCart = async () => {
        if (!product) return;

        if (!userId) {
            alert("Đăng nhập trước đã nha!");
            navigate("/login");
            return;
        }

        try {
            const res = await addToCart(userId, product, {
                selectedSize: size,
                selectedBase: base,
                selectedTopping: topping,
                selectedAddOn: null,
                note,
                quantity: qty,
            });

            if (res.merged) {
                alert("Đã cập nhật số lượng trong giỏ ✅");
            } else {
                alert("Đã thêm vào giỏ ✅");
            }
        } catch (err) {
            console.error(err);
            alert("Không thêm được vào giỏ");
        }
    };

    if (loading) return <div className="pd-page">Đang tải món ăn...</div>;
    if (!product) return <div className="pd-page">Không tìm thấy món ăn.</div>;

    const displayPrice = calcCurrentPrice(product, size, topping);

    return (
        <div className="pd-page">
           
            <div className="pd-content">
                {/* ảnh */}
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

                {/* info */}
                <div className="pd-right">
                    <h1>{product.name}</h1>
                    <p className="pd-desc">
                        {product.description || "Món này chưa có mô tả chi tiết."}
                    </p>

                    {/* size */}
                    {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                        <div className="pd-group">
                            <h3>Chọn kích cỡ</h3>
                            <div className="pd-options">
                                {product.sizes.map((s) => (
                                    <button
                                        key={s.label}
                                        type="button"
                                        className={size?.label === s.label ? "active" : ""}
                                        onClick={() => setSize(s)}
                                    >
                                        {s.label}{" "}
                                        {s.price ? s.price.toLocaleString("vi-VN") + " đ" : ""}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* base */}
                    {Array.isArray(product.bases) && product.bases.length > 0 && (
                        <div className="pd-group">
                            <h3>Chọn đế bánh</h3>
                            <div className="pd-options">
                                {product.bases.map((b) => (
                                    <button
                                        key={b.label}
                                        type="button"
                                        className={base?.label === b.label ? "active" : ""}
                                        onClick={() => setBase(b)}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* topping */}
                    {Array.isArray(product.toppings) && product.toppings.length > 0 && (
                        <div className="pd-group">
                            <h3>Thêm topping</h3>
                            <div className="pd-options">
                                {product.toppings.map((t) => (
                                    <button
                                        key={t.label}
                                        type="button"
                                        className={topping?.label === t.label ? "active" : ""}
                                        onClick={() => setTopping(t)}
                                    >
                                        {t.label}{" "}
                                        {t.price
                                            ? "+" + t.price.toLocaleString("vi-VN") + " đ"
                                            : ""}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* note */}
                    <div className="pd-group">
                        <h3>Ghi chú</h3>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ví dụ: ít cay, thêm phô mai…"
                        />
                    </div>

                    {/* actions */}
                    <div className="pd-actions-row">
                        {/* bên trái: số lượng */}
                        <div className="pd-actions-left">
                            <QuantityInput value={qty} min={1} onChange={setQty} />
                        </div>

                        {/* bên phải: giá + nút */}
                        <div className="pd-actions-right">
                            <span className="pd-price">
                                {displayPrice.toLocaleString("vi-VN")} đ
                            </span>
                            <button className="btn-primary" onClick={handleAddToCart}>
                                Thêm vào giỏ
                            </button>
                            
                        </div>
                    </div>
                </div>
            </div>

            {/* gợi ý (random) */}
            {related.length > 0 && (
                <div className="pd-related">
                    <ProductList title="Món gợi ý" items={related} limit={4} />
                </div>
            )}
        </div>
    );
}

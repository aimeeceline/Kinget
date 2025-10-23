import { FiPlus } from "react-icons/fi";
import "./ProductCard.css";

export default function ProductCard({ product, onAdd }) {
  if (!product) return null;

  // ---- Chuẩn hoá field từ nhiều kiểu DB khác nhau ----
  const name =
    product.name ??
    product.title ??
    "Sản phẩm";

  const rawPrice =
    product.price ??
    product.unitPrice ??
    product.cost ??
    0;

  const priceNumber =
    typeof rawPrice === "string" ? Number(rawPrice) : Number(rawPrice || 0);

  // Ưu tiên: thumbnail -> image -> img -> images[0]
  const rawImg =
    product.thumbnail ??
    product.image ??
    product.img ??
    (Array.isArray(product.images) ? product.images[0] : null);

  // Chuẩn hóa URL ảnh:
  // - Nếu đã là http(s) thì giữ nguyên
  // - Nếu là đường dẫn tương đối (vd: "static/product/a.jpg") thì thêm "/" đầu
  // - Nếu rỗng -> placeholder
  const imgSrc = rawImg
    ? (String(rawImg).startsWith("http")
        ? String(rawImg)
        : (String(rawImg).startsWith("/") ? String(rawImg) : `/${String(rawImg)}`))
    : "https://via.placeholder.com/500?text=No+Image";

  const handleAdd = () => onAdd?.(product);

  return (
    <article className="product-card" role="group" aria-label={name}>
      <div className="product-card__media">
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/500?text=No+Image";
          }}
        />
      </div>

      <h3 className="product-card__title" title={name}>{name}</h3>

      <button
        className="product-card__add"
        onClick={handleAdd}
        aria-label={`Thêm ${name} vào giỏ`}
        type="button"
      >
        <FiPlus size={22} aria-hidden="true" />
      </button>

      <div className="product-card__price">
        {priceNumber > 0 ? priceNumber.toLocaleString("vi-VN") : "—"}{" "}
        <span className="currency">vnđ</span>
      </div>
    </article>
  );
}

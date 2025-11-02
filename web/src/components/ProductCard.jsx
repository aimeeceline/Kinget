import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./css/ProductCard.css";

export default function ProductCard({ product, onAdd }) {
  const navigate = useNavigate();
  if (!product) return null;

  const name =
    product.name ??
    product.title ??
    "Sản phẩm";

  const rawPrice =
    product.price ??
    (Array.isArray(product.sizes) && product.sizes[0]
      ? product.sizes[0].price
      : 0);

  const priceNumber =
    typeof rawPrice === "string" ? Number(rawPrice) : Number(rawPrice || 0);

  const rawImg =
    product.thumbnail ??
    product.image ??
    product.img ??
    (Array.isArray(product.images) ? product.images[0] : null);

  const imgSrc = rawImg
    ? (String(rawImg).startsWith("http")
        ? String(rawImg)
        : (String(rawImg).startsWith("/") ? String(rawImg) : `/${String(rawImg)}`))
    : "https://via.placeholder.com/500?text=No+Image";

  // lấy id để đi tới detail
  const id =
    product.id ??
    product.productId ??
    product.docId ??
    product.key ??
    null;

  const handleCardClick = () => {
    if (!id) return;
    navigate(`/product/${id}`);
  };

  const handleAdd = (e) => {
    // chặn click lan ra card
    e.stopPropagation();
    onAdd?.(product);
  };

  return (
    <article
      className="product-card"
      role="group"
      aria-label={name}
      onClick={handleCardClick}
    >
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

      <h3 className="product-card__title" title={name}>
        {name}
      </h3>

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

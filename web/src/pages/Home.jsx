// src/pages/Home.jsx
import Slider from "../components/Slider";
import ProductList from "../components/ProductList"; // ← đúng path này

export default function Home() {
  return (
    <>
      <Slider autoplay={2000} />
      <ProductList title="Phổ biến" limit={8} />   {/* chỉ cần thế này */}
    </>
  );
}

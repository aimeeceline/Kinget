import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";

const CAT_MAP = {
  combo: { id: 1, name: "Combo" },
  pasta: { id: 2, name: "Món mỳ" },
  pizza: { id: 3, name: "Pizza" },
  salad: { id: 4, name: "Salad" },
  drink: { id: 5, name: "Thức uống" },
};


export default function Category() {
  const { slug } = useParams();
  const cat = CAT_MAP[slug];
  if (!cat) return <div style={{padding:16}}>Danh mục không tồn tại.</div>;

  return (
    <section>
      <h2>
        {cat.name}
      </h2>

      <ProductList
        params={{ categoryId: cat.id, _limit: 12 }}
        columnsDesktop={3}                // Categories 3 cột
        // limit={12}                      // (tùy chọn) cắt số item hiển thị
      />
    </section>
  );
}

// src/pages/Home.jsx
import { useEffect, useState } from "react";
import Slider from "../components/Slider";
import ProductList from "../components/ProductList";
import {
  getAllFoods,
  getFoodsForBranch,
} from "../services/foodService";

export default function Home() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      const branchId = localStorage.getItem("selectedBranchId");
      let foods = [];

      if (branchId) {
        // chỉ những món chi nhánh đang bật
        foods = await getFoodsForBranch(branchId);
      } else {
        // chưa chọn chi nhánh thì lấy hết
        foods = await getAllFoods();
      }

      // trộn random
      const shuffled = [...foods].sort(() => Math.random() - 0.5);
      // lấy 8 món đầu
      setItems(shuffled.slice(0, 8));
    }

    load();
  }, []);

  return (
    <>
      <Slider autoplay={2000} />
      <ProductList title="Phổ biến" items={items} maxWidth="1180px" />
    </>
  );
}

// src/pages/restaurant/Menu.jsx
import { useState } from "react";

const initialItems = [
  { id: "F001", name: "Gà rán cay", price: 45000, available: true },
  { id: "F002", name: "Pizza phô mai", price: 89000, available: true },
  { id: "F003", name: "Trà đào", price: 25000, available: false },
];

export default function RestaurantMenu() {
  const [items, setItems] = useState(initialItems);

  return (
    <div>
      <h1>Quản lý menu</h1>
      <p>Thêm/sửa/xoá món ăn mà nhà hàng cung cấp.</p>

      <div style={{ marginTop: 16, background: "#fff", padding: 16, borderRadius: 12 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <div>
              <strong>{item.name}</strong>
              <div>{item.price.toLocaleString()}₫</div>
            </div>
            <div>
              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  background: item.available ? "#dcfce7" : "#fee2e2",
                  color: item.available ? "#166534" : "#991b1b",
                  marginRight: 12,
                }}
              >
                {item.available ? "Đang bán" : "Tạm dừng"}
              </span>
              <button style={{ marginRight: 8 }}>Sửa</button>
              <button>Xoá</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

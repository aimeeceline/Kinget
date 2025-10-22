// 🧩 Kích cỡ món ăn (Pizza, Burger, Nước)
export interface Size {
  label: string;   // Ví dụ: "Nhỏ", "Vừa", "Lớn"
  price: number;   // Giá tiền tương ứng
}

// 🧩 Đế bánh (chỉ cho Pizza)
export interface Base {
  label: string;   // Ví dụ: "Đế mỏng", "Đế dày"
  price: number;   // Giá tiền tương ứng
}

// 🧩 Topping hoặc Add-on (Pizza, Burger, Nước)
export interface Option {
  label: string;   // Ví dụ: "Thêm phô mai", "Thêm trứng"
  price: number;   // Giá cộng thêm
}

// 🧩 Loại món
export type Category = "Pizza" | "Burger" | "Drink";

// 🧩 Định nghĩa món ăn chung
export interface Food {
  id: string;               // id document trong Firestore
  name: string;             // Tên món ăn
  category: Category;  
  price?: number;     // Loại món
  description?: string;     // Mô tả (tuỳ chọn)
  image?: string;           // URL ảnh

  // 🍕 Pizza
  sizes?: Size[];           // Kích cỡ pizza
  bases?: Base[];           // Đế bánh
  toppings?: Option[];      // Topping thêm

  // 🍔 Burger
  addOns?: Option[];        // Phần thêm như phô mai, sốt

}
// 🍱 Dùng cho giỏ hàng
export interface FoodOrderItem extends Food {
  selectedSize?: Size | null;
  selectedBase?: Base | null;
  selectedTopping?: Option | null;
  selectedAddOn?: Option | null;
  note?: string | null;
  quantity: number;
  firestoreId?: string; 
}


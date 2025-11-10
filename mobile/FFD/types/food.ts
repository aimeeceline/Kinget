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
  category: Category;       // Loại món
  price?: number;           // Giá mặc định (nếu có)
  description?: string;     // Mô tả
  image?: string;           // URL ảnh

  // 🍕 Pizza
  sizes?: Size[];           // Kích cỡ pizza
  bases?: Base[];           // Đế bánh
  toppings?: Option[];      // Danh sách topping có thể chọn

  // 🍔 Burger
  addOns?: Option[];        // Danh sách phần thêm (add-on)
}

// 🍱 Dùng cho giỏ hàng
export interface FoodOrderItem extends Food {
  selectedSize?: Size | null;
  selectedBase?: Base | null;

  // ✅ cho phép nhiều lựa chọn
  selectedTopping?: Option[]; 
  selectedAddOn?: Option[];

  note?: string | null;
  quantity: number;
  firestoreId?: string; 
  signature?: string;   
}

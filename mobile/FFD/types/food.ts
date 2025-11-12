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
// 🧩 Định nghĩa món ăn chung
export interface Food {
  id: string;               // id document (VD: F06)
  code?: string;            // Mã món (VD: F06)
  name: string;             // Tên món
  description?: string;     // Mô tả món
  category: Category;       // Loại món
  image?: string;           // Hình ảnh
  price?: number;           // Giá mặc định
  isActive?: boolean;       // Trạng thái hiển thị
  createdAt?: number;       // Thời gian tạo (timestamp)
  bases?: Base[];           // Danh sách đế bánh
  sizes?: Size[];           // Danh sách size
  toppings?: Option[];      // Danh sách topping
  addOns?: Option[];        // Danh sách add-on
}


// 🍱 Dùng cho giỏ hàng
export interface FoodOrderItem extends Food {
  firestoreId?: string;     // ID của document trong subcollection items
  quantity: number;         // Số lượng
  note?: string | null;     // Ghi chú
  selectedSize?: Size | null;
  selectedBase?: Base | null;
  selectedTopping?: Option[];
  selectedAddOn?: Option[];
  signature?: string;       // Chuỗi định danh (dùng so trùng lặp)
}




export interface Branch {
  id: string;              // id document trong Firestore
  name: string;            // Tên chi nhánh (ví dụ: "B01")
  address: string;         // Địa chỉ cụ thể
  phone?: string;          // Số điện thoại chi nhánh
  isActive?: boolean;      // Cửa hàng đang mở/tạm đóng
  restaurantName?: string; // Tên nhà hàng thuộc hệ thống
  manager?: string;        // Tên quản lý
  createdAt?: any;         // Firestore timestamp
  updatedAt?: any;
}

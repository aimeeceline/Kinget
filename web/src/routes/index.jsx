// src/routes/index.jsx
import { createBrowserRouter } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/AdminLayout";
//User pages
import Home from "../pages/Home";
import LoginPage from "../pages/LoginPage.jsx";
import Category from "../pages/Category";
import ProductDetailPage from "../pages/ProductDetail";
import CartPage from "../pages/Cart";
import CheckoutPage from "../pages/Checkout";
import OrdersPage from "../pages/Orders";
import OrderDetailPage from "../pages/OrderDetail";
//Admin pages
//import AdminDashboard from "../pages/admin/Dashboard";
//import AdminOrders from "../pages/admin/Orders";

export const router = createBrowserRouter([
  // ===== USER =====
  {
    path: "/",
    element: <UserLayout />,
    children: [
      { index: true, element: <Home /> },
        { path: "login", element: <LoginPage /> },
        { path: "category/:slug", element: <Category /> },
        {path: "product/:id", element: <ProductDetailPage /> },
        {path: "cart", element: <CartPage /> },
        {path: "checkout", element: <CheckoutPage /> },
        {path: "orders", element: <OrdersPage /> },
        {path: "orders/:id", element: <OrderDetailPage /> },  
      // ... những trang user khác
    ],
  },

//   // ===== ADMIN =====
//   {
//     path: "/admin",
//     element: <AdminLayout />,
//     children: [
//       { index: true, element: <AdminDashboard /> },
//       //{ path: "orders", element: <AdminOrders /> },
//       // ... thêm admin/product, admin/users nếu bạn muốn
//     ],
//   },
]);

// src/routes/index.jsx
import { createBrowserRouter } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/AdminLayout";
import RestaurantLayout from "../layouts/RestaurantLayout";

//User pages
import Home from "../pages/Home";
import LoginPage from "../pages/LoginPage.jsx";
import Category from "../pages/Category";
import ProductDetailPage from "../pages/ProductDetail";
import CartPage from "../pages/Cart";
import CheckoutPage from "../pages/Checkout";
import OrdersPage from "../pages/Orders";
import OrderDetailPage from "../pages/OrderDetail";
import MessagePage from "../pages/MessageOrder";
// === RESTAURANT pages ===
import RestaurantDashboard from "../pages/restaurant/Dashboard";
import RestaurantOrders from "../pages/restaurant/Orders";
import RestaurantMenu from "../pages/restaurant/Menu";
import RestaurantOrderDetail from "../pages/restaurant/OrderDetails";

//Admin pages
import AdminDashboard from "../pages/admin/Dashboard";
import AdminOrders from "../pages/admin/Orders";
import AdminUsers from "../pages/admin/User";
import AdminMenu from "../pages/admin/Menu";
import AdminBranch from "../pages/admin/Branch";
import AdminDrones from "../pages/admin/Drone";

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
        {path: "message", element: <MessagePage /> },  
    ],
  },
 // ===== RESTAURANT =====
  {
  path: "/restaurant",
  element: <RestaurantLayout />,
  children: [
    { index: true, element: <RestaurantDashboard /> },
    { path: "orders", element: <RestaurantOrders /> },
    { path: "menu", element: <RestaurantMenu /> },
    {path: "orders/:id", element: <RestaurantOrderDetail /> },
  ],
},
  // ===== ADMIN =====
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "orders", element: <AdminOrders /> },
      {path: "foods", element: <AdminMenu /> },
      {path: "users", element: <AdminUsers /> },
      {path: "branches", element: <AdminBranch /> },
      {path: "drones", element: <AdminDrones /> },
    ],
  },
]);

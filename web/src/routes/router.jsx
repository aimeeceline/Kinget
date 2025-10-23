import { createBrowserRouter, Navigate } from "react-router-dom";
import BuyerLayout from "../layouts/BuyerLayout";
import SellerLayout from "../layouts/SellerLayout";

import Home from "../pages/Home";
import Category from "../pages/Category";
import AuthPage from "../pages/AuthPage";

import { useAuth } from "../features/auth/hooks/useAuth";

/** ===== Guards (dùng ngay, không cần import file khác) ===== */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}
function RequireRole({ roles = [], children }) {
  const { user } = useAuth();
  const ok = !!user && roles.includes(user.role || "customer");
  return ok ? children : <Navigate to="/" replace />;
}

/** ===== Placeholder nhanh cho seller pages (có thể thay bằng file thật sau) ===== */
function SellerDashboard() { return <div>Seller Dashboard</div>; }
function SellerOrders()    { return <div>Seller Orders</div>; }
function SellerProducts()  { return <div>Seller Products</div>; }
function NotFound()        { return <div style={{ padding: 16 }}>404 - Không tìm thấy trang</div>; }

/** ===== Router ===== */
const router = createBrowserRouter([
  // Buyer area
  {
    path: "/",
    element: <BuyerLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "menu/:slug", element: <Category /> },
      { path: "auth", element: <AuthPage /> },

      // Nếu bạn đã có các trang này, bỏ comment và import ở trên:
      // { path: "cart", element: <CartPage /> },
      // { path: "checkout", element: <RequireAuth><CheckoutPage /></RequireAuth> },
      // { path: "orders", element: <RequireAuth><OrdersPage /></RequireAuth> },
      // { path: "orders/:id", element: <RequireAuth><OrderDetailPage /></RequireAuth> },

      { path: "*", element: <NotFound /> },
    ],
  },

  // Seller area
  {
    path: "/seller",
    element: (
      <RequireAuth>
        <RequireRole roles={["seller", "admin"]}>
          <SellerLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <SellerDashboard /> },
      { path: "orders", element: <SellerOrders /> },
      { path: "products", element: <SellerProducts /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;

// Gộp mọi Provider dùng chung cho toàn app (Auth, Cart, ...)

import { AuthProvider } from "../features/auth/hooks/useAuth";      // export từ useAuth.jsx
import { CartProvider } from "../features/cart/context/CartContext"; // giỏ hàng

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}

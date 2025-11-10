// src/pages/PaymentSuccess.jsx
import { useLocation, Link } from "react-router-dom";
import "./css/Checkout.css";
export default function PaymentSuccess() {
  const location = useLocation();
  const orderId = location.state?.orderId;

  return (
    <div className="pay-success-page">
      <div className="pay-success-box">
        <div className="pay-success-icon">✅</div>
        <h1>Thanh toán thành công</h1>
        {orderId ? (
          <p className="pay-success-text">
            Mã đơn của bạn: <strong>{orderId}</strong>
          </p>
        ) : (
          <p className="pay-success-text">
            Hệ thống đã ghi nhận đơn hàng của bạn.
          </p>
        )}
        <p className="pay-success-sub">
          Cảm ơn bạn đã đặt hàng. Bạn có thể xem lại trong “Lịch sử đơn hàng”.
        </p>

        <div className="pay-success-actions">
          <Link to="/orders" className="pay-success-btn primary">
            Xem đơn hàng
          </Link>
          <Link to="/" className="pay-success-btn">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

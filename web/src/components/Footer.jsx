import { NavLink } from "react-router-dom";
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaClock, FaGlobe } from "react-icons/fa";
import "./css/Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <>
      {/* CONTACT */}
      <section className="contact" id="contact">
        <h2>Liên hệ với Kinget</h2>
        <p>Hãy liên hệ với chúng tôi nếu có bất kỳ thắc mắc hoặc phản hồi nào.</p>
        <hr className="contact-sep" />

        <div className="contact-grid">
          {/* Cột trái */}
          <div className="contact-col">
            <p><FaMapMarkerAlt /> 273 An Dương Vương, Quận 5</p>
            <p><FaEnvelope /> kinget2004@gmail.com</p>
            <p><FaPhone /> 19002911</p>
          </div>

          {/* Cột giữa */}
          <div className="contact-col">
            <p><FaClock /> Thứ hai - Thứ bảy: 9:00 Sáng - 5:00 Chiều</p>
            <p><FaGlobe /> www.kinget.com</p>
          </div>

          {/* Cột phải: form */}
          <div className="contact-col contact-sub">
            <h3>Nhận thông báo từ chúng tôi:</h3>
            <form onSubmit={(e) => e.preventDefault()} className="sub-form">
              <input type="email" id="emailInput" placeholder="Nhập địa chỉ email của bạn" required />
              <button type="submit">Gửi</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER BAR */}
      <footer className="footer-bar">
        <div className="footer-inner">
          <span>Copyright © {year} All Rights Reserved</span>
          <NavLink to="/" className="footer-home">Trang chủ</NavLink>
        </div>
      </footer>
    </>
  );
}

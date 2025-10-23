import { useEffect, useRef, useState } from "react";
import { useAuth } from "../features/auth/hooks/useAuth";
import { Link, NavLink } from "react-router-dom";
import { FaUser, FaShoppingCart, FaSearch } from "react-icons/fa";
import "./Header.css";

export default function Header({ cartCount = 0, onSearch }) {   // ❌ bỏ userName ở props
  const [q, setQ] = useState("");
  const [openCats, setOpenCats] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const catsRef = useRef(null);
  const userRef = useRef(null);

  const CATEGORIES = [
    { to: "/menu/combo", label: "Combo", img: "/static/cat/combo.png" },
    { to: "/menu/pasta", label: "Món mỳ", img: "/static/cat/pasta.png" },
    { to: "/menu/pizza", label: "Pizza", img: "/static/cat/pizza.png" },
    { to: "/menu/salad", label: "Salad", img: "/static/cat/salad.png" },
    { to: "/menu/drink", label: "Thức uống", img: "/static/cat/drink.png" },
  ];

  useEffect(() => {
    function onDocClick(e) {
      if (catsRef.current && !catsRef.current.contains(e.target)) setOpenCats(false);
      if (userRef.current && !userRef.current.contains(e.target)) setOpenUser(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function submitSearch(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    if (onSearch) onSearch(query);
    else window.history.pushState({}, "", `/search?q=${encodeURIComponent(query)}`);
  }

  // LẤY USER TỪ CONTEXT (user đến từ db.json qua authClient -> useAuth)
  const { user, isAuthenticated, logout } = useAuth();
  const displayName = user?.username || user?.email || "";   // ✅ tên hiển thị
  return (
    <header className={`ff-header ${scrolled ? "scrolled" : ""}`}>
      <div className="ff-container">
        <nav className="ff-nav">
          <Link to="/" className="ff-logo">
<img src="/static/common/logo.png" alt="KALS" />
          </Link>
          <ul className="ff-menu">
            <li><NavLink to="/" end>Trang chủ</NavLink></li>
            <li className="ff-has-dd" ref={catsRef}>
              <NavLink to="/menu/combo" className="ff-menu-link">Thực đơn</NavLink>
              <div className="ff-dropdown" role="menu" aria-label="Thực đơn">
                <div className="ff-cat-grid">
                  {CATEGORIES.map(c => (
                    <NavLink key={c.to} to={c.to} className="ff-cat">
                      <img src={c.img} alt="" />
                      <span>{c.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </li>
          </ul>

          <div className="ff-right">
            <form className="ff-search" onSubmit={submitSearch}>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Tìm..."
                aria-label="Tìm kiếm"
              />
              <button type="submit" aria-label="Tìm kiếm"><FaSearch /></button>
            </form>

            <div className="ff-user" ref={userRef}>
              <NavLink
                to={isAuthenticated ? "/account" : "/auth"}   // ✅ đúng route
                className="ff-menu-link ff-user-link"
                aria-haspopup="menu"
              >
                <FaUser size={24} />
              </NavLink>

              <div className="ff-user-dd" role="menu" aria-label="Tài khoản">
                {isAuthenticated ? (
                  <>
                    <div className="ff-user-name">{displayName}</div>
                    <NavLink to="/orders">Lịch sử đơn hàng</NavLink>
                    <button type="button" onClick={logout}>Đăng xuất</button>
                  </>
                ) : (
                  <>
                    <NavLink to="/auth">Đăng nhập</NavLink>
                    <NavLink to="/auth">Đăng ký</NavLink>
                  </>
                )}
              </div>
            </div>

            <Link to="/cart" className="ff-cart" aria-label="Giỏ hàng">
              <FaShoppingCart />
              {cartCount > 0 && <span className="ff-badge">{cartCount}</span>}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaUser, FaShoppingCart, FaSearch } from "react-icons/fa";
import "./css/Header.css";
import { useAuthContext as useAuth } from "../hooks/useAuth.jsx";
import { db } from "@shared/FireBase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function Header({ cartCount = 0 }) {
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [openCats, setOpenCats] = useState(false);
  const [openUser, setOpenUser] = useState(false);

  // chi nhánh
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(
    localStorage.getItem("selectedBranchId") || ""
  );
  const [openBranch, setOpenBranch] = useState(false);

  const catsRef = useRef(null);
  const userRef = useRef(null);
  const branchRef = useRef(null);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const displayName = user?.firstName || user?.email || "Tài khoản";

  const CATEGORIES = [
    { to: "/category/burger", label: "Burger", img: "/static/cat/burger.png" },
    { to: "/category/pizza", label: "Pizza", img: "/static/cat/pizza.png" },
    { to: "/category/drink", label: "Thức uống", img: "/static/cat/drink.png" },
  ];

  // load branches từ Firestore (chỉ lấy isActive = true)
  useEffect(() => {
    async function loadBranches() {
      try {
        const q = query(
          collection(db, "branches"),
          where("isActive", "==", true)
        );

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setBranches(list);

        // nếu chưa chọn chi nhánh mà có data → set chi nhánh đầu
        if (!selectedBranchId && list.length > 0) {
          const firstId = list[0].id;
          setSelectedBranchId(firstId);
          localStorage.setItem("selectedBranchId", firstId);
        }
      } catch (err) {
        console.error("load branches error", err);
      }
    }
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ load 1 lần

  // đóng dropdown khi click ra ngoài
  useEffect(() => {
    function onDocClick(e) {
      if (catsRef.current && !catsRef.current.contains(e.target)) {
        setOpenCats(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setOpenUser(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target)) {
        setOpenBranch(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // sticky header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function submitSearch(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
  }

  // tên chi nhánh đang chọn
  const selectedBranchName =
    branches.find((b) => b.id === selectedBranchId)?.name || "Chọn chi nhánh";

  return (
    <header className={`ff-header ${scrolled ? "scrolled" : ""}`}>
      <div className="ff-container">
        <nav className="ff-nav">
          <Link to="/" className="ff-logo">
            <img src="/static/common/Kinget.png" alt="Kinget" />
          </Link>

          <ul className="ff-menu">
            <li>
              <NavLink to="/" end>
                Trang chủ
              </NavLink>
            </li>
            <li
              className={`ff-has-dd ${openCats ? "open" : ""}`}
              ref={catsRef}
            >
              <button
                type="button"
                className="ff-menu-link"
                onClick={() => setOpenCats((v) => !v)}
              >
                Thực đơn
              </button>
              <div className="ff-dropdown" role="menu" aria-label="Thực đơn">
                <div className="ff-cat-grid">
                  {CATEGORIES.map((c) => (
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
            {/* CHI NHÁNH */}
            <div className="ff-branch" ref={branchRef}>
              <button
                type="button"
                className="ff-branch-btn"
                onClick={() => setOpenBranch((v) => !v)}
              >
                {selectedBranchName}
              </button>
              <div
                className={`ff-branch-dd ${openBranch ? "show" : ""}`}
                role="menu"
              >
                {branches.length === 0 ? (
                  <div className="ff-branch-empty">Không có chi nhánh</div>
                ) : (
                  branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`ff-branch-item ${
                        b.id === selectedBranchId ? "active" : ""
                      }`}
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        localStorage.setItem("selectedBranchId", b.id);
                        setOpenBranch(false);
                        // nếu muốn reload toàn trang để các chỗ khác nhận branch mới
                        window.location.reload();
                      }}
                    >
                      {b.name || b.id}
                      {b.address ? (
                        <span className="ff-branch-sub">{b.address}</span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>

            <form className="ff-search" onSubmit={submitSearch}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm..."
                aria-label="Tìm kiếm"
              />
              <button type="submit" aria-label="Tìm kiếm">
                <FaSearch />
              </button>
            </form>

            {/* --- TÀI KHOẢN --- */}
            <div className="ff-user" ref={userRef}>
              {!isAuthenticated ? (
                <NavLink
                  to="/login"
                  className="ff-user-link"
                  aria-label="Tài khoản"
                >
                  <FaUser size={22} />
                </NavLink>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenUser((v) => !v)}
                    className="ff-user-link"
                    aria-label="Tài khoản"
                  >
                    <FaUser size={22} />
                  </button>
                  <div
                    className={`ff-user-dd ${openUser ? "show" : ""}`}
                    role="menu"
                  >
                    <div className="ff-user-name">{displayName}</div>
                    <NavLink to="/orders">Lịch sử đơn hàng</NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setOpenUser(false);
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* --- CART --- */}
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

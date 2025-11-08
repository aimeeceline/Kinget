// src/pages/AuthPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignInForm from "../components/auth/SignInForm";
import SignUpForm from "../components/auth/SignUpForm";
import { useAuthContext } from "../hooks/useAuth"; // 👈 dùng context
import "./css/LoginPage.css";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { isAuthenticated, user } = useAuthContext(); // 👈 lấy luôn user
  const navigate = useNavigate();

  // Nếu đã đăng nhập, chặn vào /auth và điều hướng theo role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "restaurant") {
        // nếu bạn muốn chặn pending thì check thêm user.status ở đây
        navigate("/restaurant", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSignInSuccess = (u) => {
    // form sẽ gọi cái này ngay sau login
    const usr = u || user; // phòng khi form không truyền u
    if (usr?.role === "restaurant") {
      navigate("/restaurant", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const handleSignUpSuccess = () => {
    setIsSignUp(false);
  };

  return (
    <div className="auth-page">
      <div
        className={`container ${isSignUp ? "right-panel-active" : ""}`}
        id="auth-container"
      >
        {/* SIGN UP */}
        <div className="form-container sign-up">
          <SignUpForm onSuccess={handleSignUpSuccess} />
        </div>

        {/* SIGN IN */}
        <div className="form-container sign-in">
          <SignInForm onSuccess={handleSignInSuccess} />
        </div>

        {/* TOGGLE PANELS */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Chào mừng trở lại!</h1>
              <p>Đăng nhập để mua sắm dễ dàng và hưởng nhiều ưu đãi hơn.</p>
              <button
                className="hidden"
                type="button"
                onClick={() => setIsSignUp(false)}
                aria-pressed={!isSignUp}
              >
                Đăng nhập
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Chào bạn!</h1>
              <p>Đăng ký tài khoản để nhận ưu đãi dành riêng cho bạn.</p>
              <button
                className="hidden"
                type="button"
                onClick={() => setIsSignUp(true)}
                aria-pressed={isSignUp}
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

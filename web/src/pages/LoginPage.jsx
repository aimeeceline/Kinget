// src/pages/AuthPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignInForm from "../components/auth/SignInForm";
import SignUpForm from "../components/auth/SignUpForm";
import { useAuthContext } from "../hooks/useAuth"; // 👈 dùng context
import "./css/LoginPage.css";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { isAuthenticated } = useAuthContext(); // 👈 lấy từ context
  const navigate = useNavigate();

  // Nếu đã đăng nhập, chặn vào /auth
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSignInSuccess = () => {
    navigate("/", { replace: true });
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

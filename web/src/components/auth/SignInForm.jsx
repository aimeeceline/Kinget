// src/pages/LoginPage.jsx (hoặc component form của bạn)
import { useState } from "react";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, error, loading } = useAuthContext();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(identifier.trim(), password);
      // 👇 bắt buộc để popup biết là phải hiện
      localStorage.setItem("needsAddressSetup", "1");
      navigate("/"); // về trang chủ
    } catch (err) {
      // đã có error trong context
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Email hoặc số điện thoại"
        required
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Mật khẩu"
        required
      />
      {error && <p>{error}</p>}
      <button type="submit" disabled={loading}>
        Đăng nhập
      </button>
    </form>
  );
}

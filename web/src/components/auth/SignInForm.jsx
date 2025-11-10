// src/pages/LoginPage.jsx
import { useState } from "react";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, error, loading, user } = useAuthContext();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // nhiều auth hook sẽ return user sau khi login
      const loggedUser = await login(identifier.trim(), password);

      // nếu không return thì lấy từ context / localStorage
      const finalUser =
        loggedUser ||
        user ||
        (() => {
          const u = localStorage.getItem("user");
          return u ? JSON.parse(u) : null;
        })();

      const role = finalUser?.role;

      if (role === "admin") {
        navigate("/admin");
        return;
      }

      if (role === "restaurant") {
        navigate("/restaurant");
        return;
      }

      // user bình thường → bật popup chọn địa chỉ
      localStorage.setItem("needsAddressSetup", "1");
      navigate("/");
    } catch (err) {
      // error đã có trong context rồi nên không cần làm thêm
      console.error("login error", err);
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
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}

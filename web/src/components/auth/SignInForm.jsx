import { useState } from "react";
import { useAuthContext } from "../../hooks/useAuth.jsx";

export default function SignInForm({ onSuccess }) {
  const { login, loading, error } = useAuthContext();
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const u = await login(phone.trim(), pass);
      onSuccess?.(u);
    } catch (_) {}
  };

  return (
    <form onSubmit={submit}>
      <h1>Đăng nhập</h1>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Số điện thoại"
        required
      />
      <input
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        type="password"
        placeholder="Mật khẩu"
        required
      />
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}

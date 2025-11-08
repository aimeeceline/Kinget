// src/features/auth/components/SignUpForm.jsx
import { useState } from "react";
import { useAuthContext } from "../../hooks/useAuth";

export default function SignUpForm({ onSuccess }) {
  const { register, loading, error } = useAuthContext();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [pass, setPass]           = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: pass,
    });
    alert("🎉 Đăng ký thành công! Vui lòng đăng nhập.");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Đăng ký</h1>

      <input
        type="text"
        placeholder="Họ"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Tên"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email (bắt buộc để đăng nhập)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Số điện thoại (có thể nhập)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mật khẩu"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        required
      />

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </button>
    </form>
  );
}

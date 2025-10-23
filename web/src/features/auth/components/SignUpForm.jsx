import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function SignUpForm({ onSuccess }) {
  const { register, loading, error } = useAuth();
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await register({ username: name.trim(), email: email.trim(), password: pass });
      onSuccess?.(res);             // tuỳ trang: chuyển về tab login / thông báo
    } catch { /* error đã có trong hook */ }
  };

  return (
    <form onSubmit={submit} autoComplete="on" noValidate>
      <h1>Tạo tài khoản</h1>

      <input
        type="text" name="username" placeholder="Tên đăng nhập"
        value={name} onChange={e=>setName(e.target.value)} required autoComplete="username"
      />
      <input
        type="email" name="email" placeholder="Email"
        value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
      />
      <input
        type="password" name="password" placeholder="Mật khẩu"
        value={pass} onChange={e=>setPass(e.target.value)} required autoComplete="new-password"
      />

      {error && <p style={{color:"#c00", marginTop:6}}>{error}</p>}

      <button type="submit" className="btn primary" disabled={loading}>
        {loading ? "Đang xử lý..." : "Đăng ký"}
      </button>
    </form>
  );
}

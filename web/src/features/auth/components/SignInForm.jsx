import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function SignInForm({ onSuccess }) {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, pass);
      onSuccess?.(user); // tuỳ trang xử lý (navigate/đóng modal...)
    } catch { /* error đã có trong hook */ }
  };

  return (
    <form onSubmit={submit} autoComplete="on" noValidate>
      <h1>Đăng nhập</h1>

      <input
        type="email" name="email" placeholder="Email"
        value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
      />
      <input
        type="password" name="password" placeholder="Mật khẩu"
        value={pass} onChange={e=>setPass(e.target.value)} required autoComplete="current-password"
      />

      {error && <p style={{color:"#c00", marginTop:6}}>{error}</p>}

      <div className="form-row" style={{width:"100%", display:"flex", justifyContent:"flex-end"}}>
        <a className="link" href="#" onClick={(e)=>{e.preventDefault(); alert("Quên mật khẩu (demo)");}}>
          Quên mật khẩu?
        </a>
      </div>

      <button type="submit" className="btn primary" disabled={loading}>
        {loading ? "Đang xử lý..." : "Đăng nhập"}
      </button>
    </form>
  );
}

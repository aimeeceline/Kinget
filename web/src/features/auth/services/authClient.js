const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/** Helper nhỏ để build query string */
function qs(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && u.set(k, v));
  return u.toString();
}

/** Đăng nhập: tìm user trùng email & password */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/users?${qs({ email, password })}`);
  if (!res.ok) throw new Error("NETWORK");
  const users = await res.json();
  if (!Array.isArray(users) || users.length === 0) {
    const err = new Error("INVALID_CREDENTIALS");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }
  const u = users[0];
  const token = `token-${Date.now()}`; // mock token FE
  return { token, user: { id: u.id, username: u.username, email: u.email } };
}

/** Đăng ký: check trùng email rồi POST /users */
export async function register({ username, email, password }) {
  // Check trùng email
  const exists = await fetch(`${API_URL}/users?${qs({ email })}`).then(r => r.json());
  if (exists.length > 0) {
    const err = new Error("EMAIL_TAKEN");
    err.code = "EMAIL_TAKEN";
    throw err;
  }
  // Tạo mới
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  if (!res.ok) throw new Error("NETWORK");
  const u = await res.json();
  return { id: u.id, username: u.username, email: u.email };
}

/** Lấy thông tin user hiện tại (demo) */
export async function me() {
  try {
    const j = localStorage.getItem("user");
    return j ? JSON.parse(j) : null;
  } catch { return null; }
}

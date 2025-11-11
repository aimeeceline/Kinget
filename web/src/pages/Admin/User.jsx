import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../../pages/css/Admin/Users.css";

const PAGE_SIZE = 12;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const colRef = collection(db, "users");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        // chỉ lấy user role === "user"
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => (u.role || "user") === "user");

        list.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
        setUsers(list);
        setLoading(false);
        setPage(1);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const totalPages = Math.ceil(users.length / PAGE_SIZE) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const currentData = users.slice(start, start + PAGE_SIZE);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const getDisplayName = (u) => {
    if (u.name) return u.name;
    const merge = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return merge || "—";
  };

  const toggleActive = async (u) => {
    try {
      await updateDoc(doc(db, "users", u.id), {
        isActive: !u.isActive,
      });
    } catch (e) {
      console.error(e);
      alert("Không cập nhật được trạng thái người dùng.");
    }
  };

  return (
    <div className="ad-users-wrap">
      <div className="ad-users-top">
        <div>
          <h1 className="ad-users-title">Người dùng</h1>
          
        </div>
        <button
          type="button"
          className="ad-u-add-btn"
          onClick={() => navigate("/admin/users/new")}
        >
          + Thêm người dùng
        </button>
      </div>

      {loading ? (
        <p>Đang tải người dùng...</p>
      ) : users.length === 0 ? (
        <p>Không có người dùng.</p>
      ) : (
        <>
          <table className="ad-users-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Trạng thái</th>
                <th style={{ width: 130 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((u) => (
                <tr key={u.id}>
                  <td>{getDisplayName(u)}</td>
                  <td>{u.email || "—"}</td>
                  <td>{u.phone || u.phoneNumber || "—"}</td>
                  <td>
                    {u.isActive ? (
                      <span className="ad-u-status active">Hoạt động</span>
                    ) : (
                      <span className="ad-u-status blocked">Đã khóa</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={
                        u.isActive ? "ad-u-action block" : "ad-u-action open"
                      }
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? "Khóa" : "Mở khóa"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ad-users-pagination">
            <button onClick={() => goPage(page - 1)} disabled={page === 1}>
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={p === page ? "active" : ""}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
            >
              »
            </button>
          </div>
        </>
      )}
    </div>
  );
}

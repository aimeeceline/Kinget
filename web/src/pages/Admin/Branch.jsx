// src/pages/Branches/AdminBranches.jsx (ví dụ)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../css/Admin/Branch.css";
import { deleteBranchWithConstraints } from "../../services/branchService";

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const colRef = collection(db, "branches");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id, // B01, B02...
          ...d.data(),
        }));
        list.sort((a, b) => (a.id || "").localeCompare(b.id || ""));
        setBranches(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const toggleActive = async (br) => {
    const newActive = !br.isActive;
    try {
      // 1) cập nhật chi nhánh
      await updateDoc(doc(db, "branches", br.id), {
        isActive: newActive,
      });

      // 2) cập nhật trạng thái user thuộc chi nhánh
      const usersRef = collection(db, "users");

      const q1 = query(usersRef, where("branchId", "==", br.id));
      const q2 = query(usersRef, where("restaurantBranchId", "==", br.id));

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const updates = [];

      snap1.forEach((u) => {
        updates.push(
          updateDoc(doc(db, "users", u.id), {
            isActive: newActive,
          })
        );
      });

      snap2.forEach((u) => {
        if (!snap1.docs.find((d) => d.id === u.id)) {
          updates.push(
            updateDoc(doc(db, "users", u.id), {
              isActive: newActive,
            })
          );
        }
      });

      await Promise.all(updates);
    } catch (e) {
      console.error(e);
      alert("Không cập nhật được trạng thái chi nhánh / tài khoản.");
    }
  };

  const handleDeleteBranch = async (br) => {
    if (
      !window.confirm(
        `Bạn chắc chắn muốn xoá chi nhánh ${br.id} - ${br.name || ""}?`
      )
    ) {
      return;
    }

    setDeletingId(br.id);

    try {
      await deleteBranchWithConstraints(br.id);
      alert("Đã xoá chi nhánh + tài khoản nhà hàng liên quan.");
    } catch (e) {
      console.error(e);
      alert(e.message || "Không thể xoá chi nhánh. Vui lòng thử lại sau.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="ad-branch-page">
      <div className="ad-branch-head">
        <div>
          <h1 className="ad-branch-title">Chi nhánh</h1>
        </div>
        <button
          type="button"
          className="ad-branch-add"
          onClick={() => navigate("/admin/branches/new")}
        >
          + Thêm chi nhánh
        </button>
      </div>

      {loading ? (
        <p>Đang tải chi nhánh...</p>
      ) : branches.length === 0 ? (
        <p>Chưa có chi nhánh.</p>
      ) : (
        <>
          <table className="ad-branch-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên chi nhánh</th>
                <th>Địa chỉ</th>
                <th>SĐT</th>
                <th>Trạng thái</th>
                <th style={{ width: 220 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.name || "—"}</td>
                  <td>{b.address || "—"}</td>
                  <td>{b.phone || "—"}</td>
                  <td>
                    <span
                      className={
                        b.isActive
                          ? "ad-branch-pill active"
                          : "ad-branch-pill inactive"
                      }
                    >
                      {b.isActive ? "Đang hoạt động" : "Tạm dừng"}
                    </span>
                  </td>
                  <td>
                    <div className="ad-branch-actions">
                      <button
                        type="button"
                        className="ad-branch-edit"
                        onClick={() => navigate(`/admin/branches/${b.id}/edit`)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className={
                          b.isActive
                            ? "ad-branch-toggle danger"
                            : "ad-branch-toggle"
                        }
                        onClick={() => toggleActive(b)}
                      >
                        {b.isActive ? "Khóa" : "Mở"}
                      </button>
                      <button
                        type="button"
                        className="ad-branch-delete"
                        onClick={() => handleDeleteBranch(b)}
                        disabled={deletingId === b.id}
                      >
                        {deletingId === b.id ? "Đang xoá..." : "Xoá"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

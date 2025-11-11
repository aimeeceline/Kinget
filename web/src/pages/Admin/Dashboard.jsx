import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getCountFromServer,
  getDocs,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../css/Admin/Dashboard.css";

export default function AdminDashboard() {
  const [todayOrders, setTodayOrders] = useState([]);
  const [branchesCount, setBranchesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [monthRevenue, setMonthRevenue] = useState(0);

  // đầu ngày hôm nay
  const startOfToday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  })();

  // đầu tháng hiện tại
  const startOfMonth = (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  })();

  // 1) nghe đơn hôm nay (tất cả chi nhánh)
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", startOfToday)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // mới nhất lên trước
        list.sort((a, b) => {
          const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tb - ta;
        });
        setTodayOrders(list);
        setLoadingOrders(false);
      },
      (err) => {
        console.error(err);
        setLoadingOrders(false);
      }
    );

    return () => unsub();
  }, [startOfToday]);

  // 2) đếm chi nhánh
  useEffect(() => {
    async function countBranches() {
      try {
        const coll = collection(db, "branches");
        const snapshot = await getCountFromServer(coll);
        setBranchesCount(snapshot.data().count || 0);
      } catch (e) {
        console.error(e);
      }
    }
    countBranches();
  }, []);

  // 3) đếm users (CHỈ role user)
  useEffect(() => {
    async function countUsers() {
      try {
        const coll = collection(db, "users");
        const snap = await getDocs(coll);
        const onlyUsers = snap.docs.filter(
          (d) => (d.data().role || "user") === "user"
        );
        setUsersCount(onlyUsers.length);
      } catch (e) {
        console.error(e);
      }
    }
    countUsers();
  }, []);

  // 4) tính doanh thu tháng: đơn completed từ đầu tháng
  useEffect(() => {
    async function calcMonthRevenue() {
      try {
        const q = query(
          collection(db, "orders"),
          where("createdAt", ">=", startOfMonth),
          where("status", "==", "completed")
        );
        const snap = await getDocs(q);
        const total = snap.docs.reduce((sum, docSnap) => {
          const data = docSnap.data();
          const t = typeof data.total === "number" ? data.total : 0;
          return sum + t;
        }, 0);
        setMonthRevenue(total);
      } catch (e) {
        console.error(e);
        setMonthRevenue(0);
      }
    }
    calcMonthRevenue();
  }, [startOfMonth]);



  // số đơn chờ
  const pendingCount = todayOrders.filter(
    (o) => o.status === "processing"
  ).length;

  return (
    <div className="adm-dash-wrap">
      <div className="adm-head">
        <div>
          <h1 className="adm-title">Admin dashboard</h1>
        </div>
      </div>

      {/* cards */}
      <div className="adm-cards">
        <div className="adm-card">
          <p className="adm-label">Đơn hôm nay</p>
          <p className="adm-value">
            {loadingOrders ? "…" : todayOrders.length}
          </p>
        </div>
        <div className="adm-card">
          <p className="adm-label">Đơn chờ xác nhận</p>
          <p className="adm-value">{pendingCount}</p>
        </div>
    
        <div className="adm-card">
          <p className="adm-label">Doanh thu tháng này</p>
          <p className="adm-value">
            {monthRevenue.toLocaleString("vi-VN")}₫
          </p>
        </div>
        <div className="adm-card">
          <p className="adm-label">Chi nhánh</p>
          <p className="adm-value">{branchesCount}</p>
        </div>
        <div className="adm-card">
          <p className="adm-label">Người dùng</p>
          <p className="adm-value">{usersCount}</p>
        </div>
      </div>

      {/* recent orders */}
      <div className="adm-box">
        <div className="adm-box-head">
          <h2>Đơn gần đây hôm nay</h2>
        </div>
        {todayOrders.length === 0 ? (
          <p className="adm-empty">Chưa có đơn nào hôm nay.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách</th>
                <th>Chi nhánh</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
                <th>Giờ</th>
              </tr>
            </thead>
            <tbody>
              {todayOrders.slice(0, 8).map((o) => (
                <tr key={o.id}>
                  <td>{o.code || o.id.slice(0, 6)}</td>
                  <td>{o.receiverName || "Khách"}</td>
                  <td>{o.branchId || "—"}</td>
                  <td>{(o.total || 0).toLocaleString("vi-VN")}₫</td>
                  <td>
                    <span className={`adm-badge adm-${o.status || "other"}`}>
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td>
                    {o.createdAt?.toDate
                      ? o.createdAt
                          .toDate()
                          .toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function statusLabel(st) {
  const map = {
    processing: "Chờ xác nhận",
    preparing: "Đang chuẩn bị",
    shipping: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã huỷ",
  };
  return map[st] || "Khác";
}

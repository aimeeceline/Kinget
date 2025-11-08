// src/pages/restaurant/Dashboard.jsx
export default function RestaurantDashboard() {
  return (
    <div>
      <h1>Restaurant Dashboard</h1>
      <p>Tổng quan nhanh về nhà hàng của bạn.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
          <h3>Đơn hôm nay</h3>
          <p style={{ fontSize: 28, fontWeight: 600 }}>12</p>
        </div>
        <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
          <h3>Món đang bán</h3>
          <p style={{ fontSize: 28, fontWeight: 600 }}>24</p>
        </div>
        <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
          <h3>Doanh thu tạm tính</h3>
          <p style={{ fontSize: 28, fontWeight: 600 }}>1.250.000₫</p>
        </div>
      </div>
    </div>
  );
}

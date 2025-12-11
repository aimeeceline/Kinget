// src/pages/Branches/NewBranch.jsx
import React, { useState } from "react";
import "../../pages/css/Admin/NewBranch.css";
import { createBranchWithFoodsAndAccount } from "../../services/branchService";

export default function NewBranchPage() {
  const [branchId, setBranchId] = useState(""); // ví dụ: B03
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedId = branchId.trim();

    // ===== Validate cơ bản =====
    if (!trimmedId || !name.trim()) {
      alert("Vui lòng nhập mã chi nhánh và tên chi nhánh");
      return;
    }

    if (!address.trim()) {
      alert("Vui lòng nhập địa chỉ chi nhánh");
      return;
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!lat || !lng || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      alert("Vui lòng nhập Lat/Lng hợp lệ (số).");
      return;
    }

    try {
      setLoading(true);

      // Gọi service: tạo chi nhánh + branchFoods + account restaurant
      const result = await createBranchWithFoodsAndAccount({
        id: trimmedId,
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        lat: latNum,
        lng: lngNum,
      });

      alert(
        `Đã tạo chi nhánh ${result.branchId} – ${name.trim()} và sinh branchFoods từ toàn bộ foods.\n` +
          `Đồng thời tạo account nhà hàng:\n` +
          `  ID: ${result.accountId}\n` +
          `  Email: ${result.email}\n` +
          `  Mật khẩu: ${result.password}`
      );

      // reset form
      setBranchId("");
      setName("");
      setAddress("");
      setPhone("");
      setLat("");
      setLng("");
    } catch (err) {
      console.error("Lỗi tạo chi nhánh:", err);
      alert("Tạo chi nhánh thất bại, thử lại giúp mình nhé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-branch-page">
      <h1>Tạo chi nhánh mới</h1>

      <form className="new-branch-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Mã chi nhánh (ví dụ: B03)</label>
          <input
            type="text"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            placeholder="B03"
          />
        </div>

        <div className="form-row">
          <label>Tên chi nhánh</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kinget Quận 3"
          />
        </div>

        <div className="form-row">
          <label>Địa chỉ</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Lê Lợi, Q1, TP.HCM"
          />
        </div>

        <div className="form-row two-cols">
          <div>
            <label>Số điện thoại</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0987xxxxxx"
            />
          </div>
          <div>
            <label>Lat</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="10.77..."
            />
          </div>
          <div>
            <label>Lng</label>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="106.69..."
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Đang tạo chi nhánh..." : "Tạo chi nhánh"}
        </button>
      </form>
    </div>
  );
}

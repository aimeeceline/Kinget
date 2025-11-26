// src/pages/Branches/NewBranch.jsx
import React, { useState } from "react";
import { db } from "@shared/FireBase";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import "../../pages/css/Admin/NewBranch.css"; // nhớ tạo file này

export default function NewBranchPage() {
  const [branchId, setBranchId] = useState("");      // ví dụ: B03
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedId = branchId.trim();

    if (!trimmedId || !name.trim()) {
      alert("Vui lòng nhập mã chi nhánh và tên chi nhánh");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Tạo document branch mới
      const branchRef = doc(db, "branches", trimmedId);
      await setDoc(branchRef, {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Lấy toàn bộ foods
      const foodsSnap = await getDocs(collection(db, "foods"));

      // 3️⃣ Tạo branchFoods cho chi nhánh mới (id = foodId)
      const batch = writeBatch(db);
      foodsSnap.forEach((foodDoc) => {
        const foodId = foodDoc.id; // F01, F02, ...
        const foodData = foodDoc.data();

        const branchFoodRef = doc(
          db,
          "branches",
          trimmedId,
          "branchFoods",
          foodId
        );

        batch.set(branchFoodRef, {
          foodId,
          foodName: foodData.name || "",
          isActive: true,
          stock: 0,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();

      alert(
        `Đã tạo chi nhánh ${trimmedId} – ${name} và sinh branchFoods từ toàn bộ foods.`
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

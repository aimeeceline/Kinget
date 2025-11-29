// src/pages/Foods/NewFood.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../css/Admin/NewFood.css"; // tuỳ bạn tạo / đổi path

// helper tạo object rỗng
const emptyRow = () => ({ label: "", price: 0 });

export default function NewFoodPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Pizza");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [bases, setBases] = useState([emptyRow()]);
  const [sizes, setSizes] = useState([emptyRow()]);
  const [toppings, setToppings] = useState([emptyRow()]);
  const [addOns, setAddOns] = useState([emptyRow()]);

  const [loading, setLoading] = useState(false);

  // ====== helper sinh ID F01, F02,... từ collection foods ======
  const generateNextFoodId = async () => {
    const snap = await getDocs(collection(db, "foods"));
    let maxNum = 0;

    snap.forEach((d) => {
      const id = d.id; // ví dụ "F01"
      const m = /^F(\d+)$/.exec(id);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > maxNum) maxNum = n;
      }
    });

    const next = maxNum + 1;
    return "F" + String(next).padStart(2, "0"); // F01, F02, F10...
  };

  // ====== helper cho mảng (bases, sizes, toppings, addOns) ======
  const updateArray = (setter) => (index, field, value) => {
    setter((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]:
                field === "price" ? Number(value) || 0 : value,
            }
          : row
      )
    );
  };

  const addRow = (setter) => () =>
    setter((prev) => [...prev, emptyRow()]);

  const removeRow = (setter) => (index) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Vui lòng nhập tên món.");
      return;
    }
    if (!category) {
      alert("Vui lòng chọn danh mục.");
      return;
    }

    try {
      setLoading(true);

      // 1. Sinh ID tiếp theo
      const foodId = await generateNextFoodId(); // ví dụ F07

      // 2. Chuẩn hoá mảng: bỏ dòng trống, ép price thành number
      const cleanArray = (arr) =>
        arr
          .map((r) => ({
            label: (r.label || "").trim(),
            price: Number(r.price) || 0,
          }))
          .filter((r) => r.label !== "");

      const basesClean = cleanArray(bases);
      const sizesClean = cleanArray(sizes);
      const toppingsClean = cleanArray(toppings);
      const addOnsClean = cleanArray(addOns);

      // 3. Payload cho collection foods (giống hình bạn gửi)
      const payload = {
        name: name.trim(),
        category,
        code: foodId, // code = F01,...
        description: description.trim(),
        image: image.trim(),
        isActive,
        createdAt: serverTimestamp(),
      };

      if (basesClean.length > 0) payload.bases = basesClean;
      if (sizesClean.length > 0) payload.sizes = sizesClean;
      if (toppingsClean.length > 0) payload.toppings = toppingsClean;
      if (addOnsClean.length > 0) payload.addOns = addOnsClean;

      // 4. Lưu món mới vào /foods/{foodId}
      await setDoc(doc(db, "foods", foodId), payload);

      // 5. Sinh branchFoods cho TẤT CẢ chi nhánh
      const branchesSnap = await getDocs(collection(db, "branches"));
      if (!branchesSnap.empty) {
        const batch = writeBatch(db);
        branchesSnap.forEach((brDoc) => {
          const brId = brDoc.id;
          const bfRef = doc(
            db,
            "branches",
            brId,
            "branchFoods",
            foodId
          );

          batch.set(bfRef, {
            foodId, // "F01"
            foodName: name.trim(),
            isActive: true,
            stock: 0,
            price: 0, // cho chắc ăn với rules
            createdAt: serverTimestamp(),
          });
        });

        await batch.commit();
      }

      alert(`Đã tạo món ${name} với ID ${foodId}.`);

      // Reset form nhẹ nhàng
      setName("");
      setDescription("");
      setImage("");
      setCategory("Pizza");
      setIsActive(true);
      setBases([emptyRow()]);
      setSizes([emptyRow()]);
      setToppings([emptyRow()]);
      setAddOns([emptyRow()]);

      // Nếu muốn quay về list:
      // navigate("/admin/foods");
    } catch (err) {
      console.error(err);
      alert("Tạo món thất bại, thử lại giúp mình nhé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-food-page">
      <h1>Thêm món mới</h1>

      <form className="new-food-form" onSubmit={handleSubmit}>
        {/* Thông tin chung */}
        <div className="nf-section">
          <h2>Thông tin cơ bản</h2>

          <div className="nf-row">
            <label>Tên món *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pizza Hải Sản Cocktail"
            />
          </div>

          <div className="nf-row">
            <label>Danh mục *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Pizza">Pizza</option>
              <option value="Burger">Burger</option>
              <option value="Drink">Drink</option>
            </select>
          </div>

          <div className="nf-row">
            <label>Ảnh (URL)</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="nf-row">
            <label>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả món ăn..."
            />
          </div>

          <div className="nf-row nf-checkbox">
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />{" "}
              Đang bán
            </label>
          </div>

          <div className="nf-row">
            <label>Mã tự sinh</label>
            <input
              type="text"
              value="Sẽ tự sinh như F01, F02 khi lưu"
              disabled
            />
          </div>
        </div>

        {/* Bases */}
        <div className="nf-section">
          <h2>Đế (bases) – cho Pizza</h2>
          {bases.map((row, idx) => (
            <div className="nf-row nf-inline" key={`base-${idx}`}>
              <input
                type="text"
                placeholder="Đế mỏng"
                value={row.label}
                onChange={(e) =>
                  updateArray(setBases)(idx, "label", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Giá thêm (0 nếu miễn phí)"
                value={row.price}
                onChange={(e) =>
                  updateArray(setBases)(idx, "price", e.target.value)
                }
              />
              {bases.length > 1 && (
                <button
                  type="button"
                  className="nf-remove"
                  onClick={removeRow(setBases)(idx)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="nf-add-row"
            onClick={addRow(setBases)}
          >
            + Thêm đế
          </button>
        </div>

        {/* Sizes */}
        <div className="nf-section">
          <h2>Size (sizes)</h2>
          {sizes.map((row, idx) => (
            <div className="nf-row nf-inline" key={`size-${idx}`}>
              <input
                type="text"
                placeholder="Nhỏ / Vừa / Lớn..."
                value={row.label}
                onChange={(e) =>
                  updateArray(setSizes)(idx, "label", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Giá"
                value={row.price}
                onChange={(e) =>
                  updateArray(setSizes)(idx, "price", e.target.value)
                }
              />
              {sizes.length > 1 && (
                <button
                  type="button"
                  className="nf-remove"
                  onClick={removeRow(setSizes)(idx)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="nf-add-row"
            onClick={addRow(setSizes)}
          >
            + Thêm size
          </button>
        </div>

        {/* Toppings */}
        <div className="nf-section">
          <h2>Topping (toppings)</h2>
          {toppings.map((row, idx) => (
            <div className="nf-row nf-inline" key={`top-${idx}`}>
              <input
                type="text"
                placeholder="Thêm phô mai..."
                value={row.label}
                onChange={(e) =>
                  updateArray(setToppings)(idx, "label", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Giá"
                value={row.price}
                onChange={(e) =>
                  updateArray(setToppings)(idx, "price", e.target.value)
                }
              />
              {toppings.length > 1 && (
                <button
                  type="button"
                  className="nf-remove"
                  onClick={removeRow(setToppings)(idx)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="nf-add-row"
            onClick={addRow(setToppings)}
          >
            + Thêm topping
          </button>
        </div>

        {/* AddOns */}
        <div className="nf-section">
          <h2>Thêm kèm (addOns) – hay dùng cho Burger / Drink</h2>
          {addOns.map((row, idx) => (
            <div className="nf-row nf-inline" key={`addon-${idx}`}>
              <input
                type="text"
                placeholder="Thêm phô mai, Thêm sốt..."
                value={row.label}
                onChange={(e) =>
                  updateArray(setAddOns)(idx, "label", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Giá"
                value={row.price}
                onChange={(e) =>
                  updateArray(setAddOns)(idx, "price", e.target.value)
                }
              />
              {addOns.length > 1 && (
                <button
                  type="button"
                  className="nf-remove"
                  onClick={removeRow(setAddOns)(idx)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="nf-add-row"
            onClick={addRow(setAddOns)}
          >
            + Thêm add-on
          </button>
        </div>

        <div className="nf-actions">
          <button
            type="button"
            className="nf-btn secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="nf-btn primary"
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu món"}
          </button>
        </div>
      </form>
    </div>
  );
}

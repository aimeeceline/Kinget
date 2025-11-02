import { useState, useEffect } from "react";
import "./css/quantity.css";

export default function QuantityInput({
  value = 1,
  min = 1,
  max,
  step = 1,
  onChange,
  size = "md", // "sm" | "md"
}) {
  const [qty, setQty] = useState(value);

  // nếu parent đổi value từ ngoài, sync lại
  useEffect(() => {
    setQty(value);
  }, [value]);

  const clamp = (n) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const handleSet = (next) => {
    const v = clamp(next);
    setQty(v);
    onChange && onChange(v);
  };

  return (
    <div className={`qty ${size === "sm" ? "qty--sm" : ""}`}>
      <button type="button" onClick={() => handleSet(qty - step)}>
        −
      </button>
      <input
        type="number"
        value={qty}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            setQty("");
            return;
          }
          const num = parseInt(raw, 10);
          if (isNaN(num)) return;
          handleSet(num);
        }}
        onBlur={() => {
          // nếu để trống rồi blur thì kéo lại min
          if (qty === "") handleSet(min ?? 1);
        }}
      />
      <button type="button" onClick={() => handleSet(qty + step)}>
        +
      </button>
    </div>
  );
}

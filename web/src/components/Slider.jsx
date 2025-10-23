import { useEffect, useRef, useState } from "react";
import "./Slider.css";

// Gọi API qua proxy Vite: /api
const API = import.meta.env.VITE_API_URL || "/api";

// Chuẩn hoá URL ảnh:
// - http(s) giữ nguyên
// - bắt đầu "/" giữ nguyên
// - còn lại (vd "banner/slider2.png") => tự thêm "/static/"
function toImgUrl(v) {
  if (!v) return "https://via.placeholder.com/1280x480?text=No+Banner";
  const s = String(v).trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return `/static/${s.replace(/^\/+/, "")}`;
}

export default function Slider({ autoplay = 4000 }) {
  const [slides, setSlides] = useState([]);        // [{src, alt}]
  const [active, setActive] = useState(0);
  const listRef = useRef(null);                    // .lista
  const itemRefs = useRef([]);                     // .item refs
  const timerRef = useRef(null);

  // Tải danh sách banner
  useEffect(() => {
    const ac = new AbortController();
    fetch(`${API}/banners`, { signal: ac.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(arr => {
        const data = (Array.isArray(arr) ? arr : []).map((b, i) => ({
          src: toImgUrl(b.path ?? b.src ?? b.image ?? b.url ?? b.file),
          alt: b.alt ?? b.title ?? `banner-${b.id ?? i}`
        }));
        setSlides(data);
        setActive(0);
        itemRefs.current = []; // reset ref list
      })
      .catch(e => {
        if (e.name !== "AbortError") console.error("Load banners failed:", e);
      });
    return () => ac.abort();
  }, []);

  // Tự chạy
  useEffect(() => {
    if (!slides.length || !autoplay) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setActive(i => (i + 1) % slides.length),
      autoplay
    );
    return () => clearInterval(timerRef.current);
  }, [slides.length, autoplay]);

  // Cập nhật vị trí bằng left (để hợp với CSS cũ)
  useEffect(() => {
    const listEl = listRef.current;
    const current = itemRefs.current[active];
    if (!listEl || !current) return;
    // Dịch theo vị trí phần tử hiện tại
    listEl.style.left = `-${current.offsetLeft}px`;
  }, [active, slides.length]);

  if (!slides.length) return null;

  const prev = () => setActive(i => (i - 1 + slides.length) % slides.length);
  const next = () => setActive(i => (i + 1) % slides.length);

  return (
    <div
      className="slider"
      onMouseEnter={() => clearInterval(timerRef.current)}  // giữ behavior pause on hover
    >
      {/* Giữ NGUYÊN class & cấu trúc cũ để không đổi style */}
      <div className="lista" ref={listRef}>
        {slides.map((img, i) => (
          <div className="item" key={i} ref={el => (itemRefs.current[i] = el)}>
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/1280x480?text=Image+Not+Found";
              }}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="bat">
          <button onClick={prev} aria-label="Trước">&#60;</button>
          <button onClick={next} aria-label="Sau">&#62;</button>
        </div>
      )}
    </div>
  );
}

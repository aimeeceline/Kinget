// src/components/Slider.jsx
import { useEffect, useRef, useState } from "react";
import "./css/Slider.css";

// 🎯 dùng ảnh trong public
const LOCAL_SLIDES = [
  { src: "/slider/slider1.png", alt: "Slider 1" },
  { src: "/slider/slider2.png", alt: "Slider 2" },
  { src: "/slider/slider3.png", alt: "Slider 3" },
  { src: "/slider/slider4.png", alt: "Slider 4" },
];

export default function Slider({ autoplay = 4000 }) {
  const [slides, setSlides] = useState(LOCAL_SLIDES);
  const [active, setActive] = useState(0);

  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const timerRef = useRef(null);

  // auto chạy
  useEffect(() => {
    if (!slides.length || !autoplay) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      autoplay
    );
    return () => clearInterval(timerRef.current);
  }, [slides, autoplay]);

  // dịch chuyển theo item
  useEffect(() => {
    const listEl = listRef.current;
    const current = itemRefs.current[active];
    if (!listEl || !current) return;
    listEl.style.left = `-${current.offsetLeft}px`;
  }, [active, slides.length]);

  if (!slides.length) return null;

  const prev = () => setActive((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setActive((i) => (i + 1) % slides.length);

  return (
    <div
      className="slider"
      onMouseEnter={() => clearInterval(timerRef.current)}
    >
      <div className="lista" ref={listRef}>
        {slides.map((img, i) => (
          <div
            className="item"
            key={i}
            ref={(el) => (itemRefs.current[i] = el)}
          >
            <img src={img.src} alt={img.alt} />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="bat">
          <button onClick={prev} aria-label="Trước">
            &#60;
          </button>
          <button onClick={next} aria-label="Sau">
            &#62;
          </button>
        </div>
      )}
    </div>
  );
}

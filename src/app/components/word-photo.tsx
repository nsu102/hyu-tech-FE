/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import type { BBox, Word } from "../data";
import { wordVisual } from "../word-photos";
import { Icon } from "../icons";

// Region of the photo (pixels) with the frame's aspect ratio, centred on the object, kept inside the photo.
// It is as small as possible while still containing the object plus a margin; if the photo is too small for
// that, it fills the frame anyway and trims the object's edges.
export function frameCrop([x, y, w, h]: BBox, photoW: number, photoH: number, aspect: number, margin = 0.15) {
  let cw = w * (1 + 2 * margin) * photoW, ch = h * (1 + 2 * margin) * photoH;
  if (cw / ch < aspect) cw = ch * aspect; else ch = cw / aspect;
  const fit = Math.min(1, photoW / cw, photoH / ch);
  cw *= fit; ch *= fit;
  const cx = (x + w / 2) * photoW, cy = (y + h / 2) * photoH;
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
  return { x: clamp(cx - cw / 2, photoW - cw), y: clamp(cy - ch / 2, photoH - ch), w: cw, h: ch };
}

export function WordPhoto({ word, scene, className = "", eager = false }: {
  word: Word; scene: string; className?: string; eager?: boolean;
}) {
  const visual = wordVisual(word, scene);
  const frame = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{ src: string; w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState(4 / 3);
  const cropSrc = visual.bbox ? visual.src : null;
  useEffect(() => {
    if (!cropSrc) return;
    const img = new Image();
    img.onload = () => setSize({ src: cropSrc, w: img.naturalWidth, h: img.naturalHeight });
    img.src = cropSrc;
  }, [cropSrc]);
  useEffect(() => {
    const el = frame.current;
    if (!el || !cropSrc) return;
    // The frame shrinks when the answer is revealed, so the crop follows its shape.
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setAspect(width / height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [cropSrc]);

  if (word.imageStatus === "pending") return <span className={`word-photo image-pending ${className}`} role="status" aria-label="이미지 생성 중"><span className="spinner"/></span>;
  if (word.imageStatus === "failed") return <span className={`word-photo image-failed ${className}`} role="img" aria-label="단어 이미지 오류"><Icon name="image" size={28}/></span>;

  if (visual.bbox) {
    const c = size?.src === visual.src ? frameCrop(visual.bbox, size.w, size.h, aspect) : null;
    return <span ref={frame} className={`word-photo word-photo--crop ${className}`}>
      {c && size && <svg viewBox={`${c.x} ${c.y} ${c.w} ${c.h}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${word.korean} · ${visual.label}`}>
        <image href={visual.src} width={size.w} height={size.h}/>
      </svg>}
    </span>;
  }
  return <span className={`word-photo word-photo--${visual.kind} ${className}`}>
    <img src={visual.src} alt={`${word.korean} · ${visual.label}`} loading={eager ? "eager" : "lazy"} draggable={false} width={480} height={360}/>
  </span>;
}

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useState } from "react";
import type { Word } from "../data";
import { wordVisual } from "../word-photos";
import { Icon } from "../icons";

export function WordPhoto({ word, scene, className = "", eager = false }: {
  word: Word; scene: string; className?: string; eager?: boolean;
}) {
  const visual = wordVisual(word, scene);
  const clipId = useId();
  // Natural size of the scene photo, needed to crop it without stretching.
  const [size, setSize] = useState<{ src: string; w: number; h: number } | null>(null);
  const cropSrc = visual.bbox ? visual.src : null;
  useEffect(() => {
    if (!cropSrc) return;
    const img = new Image();
    img.onload = () => setSize({ src: cropSrc, w: img.naturalWidth, h: img.naturalHeight });
    img.src = cropSrc;
  }, [cropSrc]);

  if (word.imageStatus === "pending") return <span className={`word-photo image-pending ${className}`} role="status" aria-label="이미지 생성 중"><span className="spinner"/></span>;
  if (word.imageStatus === "failed") return <span className={`word-photo image-failed ${className}`} role="img" aria-label="단어 이미지 오류"><Icon name="image" size={28}/></span>;

  if (visual.bbox) {
    if (size?.src !== visual.src) return <span className={`word-photo word-photo--crop ${className}`}/>;
    // The SVG viewBox is the crop; "meet" scales it uniformly to fit, so the photo keeps its proportions.
    const [x, y, w, h] = visual.bbox, vx = x * size.w, vy = y * size.h, vw = w * size.w, vh = h * size.h;
    return <span className={`word-photo word-photo--crop ${className}`}>
      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${word.korean} · ${visual.label}`}>
        <clipPath id={clipId}><rect x={vx} y={vy} width={vw} height={vh} rx={Math.min(vw, vh) * 0.08}/></clipPath>
        <image href={visual.src} width={size.w} height={size.h} clipPath={`url(#${clipId})`}/>
      </svg>
    </span>;
  }
  return <span className={`word-photo word-photo--${visual.kind} ${className}`}>
    <img src={visual.src} alt={`${word.korean} · ${visual.label}`} loading={eager ? "eager" : "lazy"} draggable={false} width={480} height={360}/>
  </span>;
}

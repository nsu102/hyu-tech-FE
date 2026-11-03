"use client";

import { useRef, useState, type PointerEvent, type CSSProperties } from "react";
import type { Word } from "../data";
import { Icon } from "../icons";
import { LearningCard } from "./learning-card";

export function SwipeDeck({ words, scene, index, revealed, onReveal, onIndexChange, onEdit, onSpeak }: {
  words: Word[]; scene: string; index: number; revealed: boolean;
  onReveal: (revealed: boolean) => void; onIndexChange: (index: number) => void;
  onEdit: () => void; onSpeak: (text: string) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ x: number; y: number; time: number; axis: "x" | "y" | null } | null>(null);
  const suppressClick = useRef(false);
  const last = index === words.length - 1;
  function change(next: number) {
    if (next >= 0 && next < words.length) onIndexChange(next);
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if ((event.target as HTMLElement).closest(".sound-button")) return;
    gesture.current = { x: event.clientX, y: event.clientY, time: performance.now(), axis: null };
    suppressClick.current = false;
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 9) {
      start.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      suppressClick.current = true;
      if (start.axis === "x") { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }
    }
    if (start.axis === "x") {
      const atEdge = (index === 0 && dx > 0) || (last && dx < 0);
      setDragX(dx * (atEdge ? 0.23 : 0.85));
    }
  }
  function end(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = gesture.current;
    gesture.current = null; setDragging(false); setDragX(0);
    if (!start || cancelled || start.axis !== "x") return;
    const dx = event.clientX - start.x;
    const elapsed = Math.max(1, performance.now() - start.time);
    const threshold = Math.min(75, event.currentTarget.clientWidth * 0.2);
    if (Math.abs(dx) > threshold || (Math.abs(dx) > 28 && Math.abs(dx) / elapsed > 0.5)) change(index + (dx < 0 ? 1 : -1));
  }
  const style = { "--drag-x": `${dragX}px`, "--drag-angle": `${dragX / 32}deg` } as CSSProperties;
  return <div className="swipe-deck" role="region" aria-roledescription="카드 모음" aria-label="단어 학습 카드" onKeyDown={event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); change(index + (event.key === "ArrowRight" ? 1 : -1)); }
  }}>
    <div className="deck-toolbar"><span className="deck-progress" aria-live="polite"><span className="deck-bar"><span style={{ width: `${(index + 1) / words.length * 100}%` }}/></span>{index + 1} / {words.length}</span><button className="icon-button" onClick={onEdit} aria-label={`${words[index].korean} 단어 수정`}><Icon name="edit" size={18}/></button></div>
    <div className={`swipe-surface ${dragging ? "is-dragging" : ""}`} style={style} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)} onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
      <div className="swipe-moving-card"><LearningCard word={words[index]} scene={scene} revealed={revealed} onReveal={onReveal} onSpeak={onSpeak}/></div>
    </div>
    <div className="deck-controls"><button className="icon-button" aria-label="이전 단어" disabled={index === 0} onClick={() => change(index - 1)}><Icon name="back" size={22}/></button><button className="icon-button" aria-label="다음 단어" disabled={last} onClick={() => change(index + 1)}><Icon name="chevron" size={22}/></button></div>
    <span className="sr-only" role="status">{index + 1} / {words.length} 카드 · {words[index].korean}</span>
  </div>;
}

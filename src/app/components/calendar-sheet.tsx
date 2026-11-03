"use client";
import { useState } from "react";
import { Icon } from "../icons";

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// Month grid for the bottom sheet. `counts` maps YYYY-MM-DD to the number of books saved that day.
export function CalendarSheet({ counts, value, today, onPick }: {
  counts: Map<string, number>; value: string; today: string; onPick: (date: string) => void;
}) {
  const latest = [...counts.keys()].sort().at(-1);
  const start = value || latest || today;
  const [month, setMonth] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 });
  const first = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
  const days = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const shift = (delta: number) => setMonth(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (m + delta + 12) % 12 }));
  const monthTotal = [...counts].filter(([d]) => d.startsWith(`${month.y}-${pad(month.m + 1)}`)).reduce((n, [, c]) => n + c, 0);

  return <div className="calendar">
    <div className="calendar-head">
      <button className="icon-button" onClick={() => shift(-1)} aria-label="이전 달"><Icon name="back" size={18}/></button>
      <strong aria-live="polite">{month.y}년 {month.m + 1}월</strong>
      <button className="icon-button" onClick={() => shift(1)} aria-label="다음 달"><Icon name="chevron" size={18}/></button>
    </div>
    <div className="calendar-grid" role="grid">
      {WEEKDAYS.map(d => <span key={d} className="calendar-weekday">{d}</span>)}
      {Array.from({ length: first }, (_, i) => <span key={`e${i}`}/>)}
      {Array.from({ length: days }, (_, i) => {
        const date = `${month.y}-${pad(month.m + 1)}-${pad(i + 1)}`, count = counts.get(date) ?? 0;
        return <button key={date} className={`calendar-day ${date === value ? "selected" : ""} ${date === today ? "today" : ""}`}
          disabled={!count} onClick={() => onPick(date)} aria-label={`${month.m + 1}월 ${i + 1}일${count ? `, 단어집 ${count}개` : ""}`} aria-pressed={date === value}>
          {i + 1}{!!count && <i className="calendar-dot"/>}
        </button>;
      })}
    </div>
    <p className="calendar-foot">{monthTotal ? `이번 달 단어집 ${monthTotal}개 · 점이 있는 날을 눌러 보세요` : "이 달에는 만든 단어집이 없어요"}</p>
  </div>;
}

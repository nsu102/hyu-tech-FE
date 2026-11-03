"use client";
import { useState } from "react";
import { Icon } from "../icons";
import { useI18n } from "../i18n";

const pad = (n: number) => String(n).padStart(2, "0");

// Month grid for the bottom sheet. `counts` maps YYYY-MM-DD to the number of books saved that day.
export function CalendarSheet({ counts, value, today, onPick }: {
  counts: Map<string, number>; value: string; today: string; onPick: (date: string) => void;
}) {
  const { lang, t } = useI18n();
  // 2023-01-01 was a Sunday, so these are Sunday-first weekday names in the UI language.
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2023, 0, 1 + i)).toLocaleDateString(lang, { weekday: "narrow", timeZone: "UTC" }));
  const latest = [...counts.keys()].sort().at(-1);
  const start = value || latest || today;
  const [month, setMonth] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 });
  const first = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
  const days = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const shift = (delta: number) => setMonth(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (m + delta + 12) % 12 }));

  return <div className="calendar">
    <div className="calendar-head">
      <button className="icon-button" onClick={() => shift(-1)} aria-label={t("calendar.prev")}><Icon name="back" size={18}/></button>
      <strong aria-live="polite">{new Date(Date.UTC(month.y, month.m, 1)).toLocaleDateString(lang, { year: "numeric", month: "long", timeZone: "UTC" })}</strong>
      <button className="icon-button" onClick={() => shift(1)} aria-label={t("calendar.next")}><Icon name="chevron" size={18}/></button>
    </div>
    <div className="calendar-grid" role="grid">
      {weekdays.map((d, i) => <span key={i} className="calendar-weekday">{d}</span>)}
      {Array.from({ length: first }, (_, i) => <span key={`e${i}`}/>)}
      {Array.from({ length: days }, (_, i) => {
        const date = `${month.y}-${pad(month.m + 1)}-${pad(i + 1)}`, count = counts.get(date) ?? 0;
        return <button key={date} className={`calendar-day ${date === value ? "selected" : ""} ${date === today ? "today" : ""}`}
          disabled={!count} onClick={() => onPick(date)} aria-label={`${new Date(Date.UTC(month.y, month.m, i + 1)).toLocaleDateString(lang, { month: "long", day: "numeric", timeZone: "UTC" })}${count ? `, ${t("calendar.books", { n: count })}` : ""}`} aria-pressed={date === value}>
          {i + 1}{!!count && <i className="calendar-dot"/>}
        </button>;
      })}
    </div>
  </div>;
}

import type { CSSProperties, ReactNode } from "react";
export function Icon({ name, size = 22, className = "", style }: { name: string; size?: number; className?: string; style?: CSSProperties }) {
  const paths: Record<string, ReactNode> = {
    camera: <><path d="M14.5 4h-5L7.7 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.7z"/><circle cx="12" cy="13.5" r="3.5"/></>,
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>,
    book: <><path d="M12 5C9 3 5 3 2 4v16c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1zM12 5v16"/></>,
    cards: <><rect x="6" y="3" width="15" height="18" rx="3"/><path d="M3 6v12a3 3 0 0 0 3 3M11 9h5m-5 4h5"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, back: <path d="m14 5-7 7 7 7"/>, chevron: <path d="m9 5 7 7-7 7"/>, down: <path d="m6 9 6 6 6-6"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>, plus: <path d="M12 4v16M4 12h16"/>,
    upload: <path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></>,
    volume: <path d="m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>,
    search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>, check: <path d="m5 12 4 4L19 6"/>,
    globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
    sparkle: <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>,
    rotate: <path d="M20 7V2m0 5h-5M20 7a9 9 0 1 0 1 9"/>, edit: <path d="m15 4 5 5M4 16 16 4a2.1 2.1 0 0 1 3 3L7 19l-4 1z"/>,
    trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>,
    heart: <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6z"/>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4m8-4v4"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name] || paths.sparkle}</svg>;
}

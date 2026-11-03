// Generates the cute word illustrations in public/illustrations. Run: node scripts/illustrations.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#3b3054";
const dir = new URL("../public/illustrations/", import.meta.url);
mkdirSync(dir, { recursive: true });

// Kawaii face centred at (x, y); s scales it.
const face = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
<circle cx="-9" cy="0" r="3" fill="${INK}"/><circle cx="9" cy="0" r="3" fill="${INK}"/>
<path d="M-4 5q4 4 8 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="-16" cy="6" rx="4" ry="2.6" fill="#ff8fa3" opacity=".55"/><ellipse cx="16" cy="6" rx="4" ry="2.6" fill="#ff8fa3" opacity=".55"/></g>`;
const svg = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
<circle cx="60" cy="60" r="56" fill="${bg}" stroke="none"/>
${body}
</svg>
`;

const art = {
  coffee: ["#ffe9d6", `<path d="M30 48h50v26a20 20 0 0 1-20 20H50a20 20 0 0 1-20-20z" fill="#fff"/><path d="M80 56h6a9 9 0 0 1 0 18h-7" /><ellipse cx="55" cy="48" rx="25" ry="5" fill="#8b5a3c"/><path d="M48 26q-4 6 0 12M60 22q-4 6 0 12" stroke-width="3"/>${face(55, 70)}`],
  apple: ["#ffe1e1", `<path d="M60 40c-10-8-34-6-34 20 0 22 16 36 26 36 4 0 6-2 8-2s4 2 8 2c10 0 26-14 26-36 0-26-24-28-34-20z" fill="#ff7a7a"/><path d="M60 40c0-8 2-14 6-18"/><path d="M64 30c6-8 16-8 18-4-4 6-12 8-18 4z" fill="#7bd389"/>${face(60, 66)}`],
  book: ["#e3ecff", `<path d="M24 34h30a6 6 0 0 1 6 6v52a6 6 0 0 0-6-6H24z" fill="#8fb3ff"/><path d="M96 34H66a6 6 0 0 0-6 6v52a6 6 0 0 1 6-6h30z" fill="#b8ceff"/>${face(42, 58, .7)}${face(78, 58, .7)}`],
  milk: ["#e6f4ff", `<path d="M42 34h36v58a4 4 0 0 1-4 4H46a4 4 0 0 1-4-4z" fill="#fff"/><path d="M42 34l8-12h20l8 12" fill="#9ed2ff"/><rect x="42" y="48" width="36" height="16" fill="#9ed2ff" stroke="none"/>${face(60, 78, .8)}`],
  chair: ["#fff1d6", `<rect x="36" y="22" width="48" height="36" rx="10" fill="#ffc46b"/><rect x="30" y="58" width="60" height="12" rx="6" fill="#ffb347"/><path d="M38 70v26M82 70v26"/>${face(60, 40, .8)}`],
  bed: ["#efe6ff", `<path d="M20 50v44M100 64v30M20 82h80" /><rect x="20" y="62" width="80" height="20" rx="6" fill="#c7b3ff"/><rect x="26" y="52" width="24" height="14" rx="7" fill="#fff"/>${face(70, 72, .7)}<path d="M84 34h10l-10 10h10M70 26h7l-7 7h7" stroke-width="2.5"/>`],
  desk: ["#fff1d6", `<rect x="20" y="48" width="80" height="12" rx="4" fill="#d9a066"/><path d="M28 60v34M92 60v34"/><rect x="62" y="60" width="26" height="20" fill="#f2c28c"/><rect x="34" y="30" width="22" height="18" rx="3" fill="#8fb3ff"/>${face(45, 40, .45)}`],
  lamp: ["#fff6d1", `<path d="M44 30h32l10 30H34z" fill="#ffd95e"/><path d="M60 60v30M44 92h32"/><circle cx="60" cy="74" r="0"/>${face(60, 46, .7)}<path d="M28 70l-8 4M92 70l8 4M60 66v0" stroke="#ffb800"/>`],
  menu: ["#ffe9d6", `<rect x="34" y="20" width="52" height="76" rx="8" fill="#fff"/><path d="M46 36h28M46 50h20M46 60h24M46 70h16" stroke-width="3"/><circle cx="74" cy="80" r="0"/>${face(62, 84, .55)}`],
  sign: ["#e0f7ef", `<path d="M60 20v14"/><rect x="24" y="34" width="72" height="38" rx="10" fill="#7fd8b5"/><path d="M40 72l-8 24M80 72l8 24"/>${face(60, 52, .9)}`],
  order: ["#ffe9d6", `<path d="M30 80a30 30 0 0 1 60 0z" fill="#ffd95e"/><path d="M24 80h72M60 50v-8"/><circle cx="60" cy="40" r="4" fill="${INK}"/>${face(60, 68, .65)}`],
  takeout: ["#ffe9d6", `<path d="M38 36h44l-6 60H44z" fill="#fff"/><rect x="34" y="28" width="52" height="10" rx="4" fill="#c68b59"/><rect x="40" y="56" width="40" height="18" fill="#c68b59" stroke="none"/>${face(60, 80, .65)}`],
  pay: ["#e6f4ff", `<rect x="22" y="36" width="76" height="50" rx="10" fill="#7fb6ff"/><path d="M22 50h76" stroke-width="8"/><rect x="32" y="62" width="16" height="10" rx="2" fill="#ffd95e"/>${face(74, 70, .6)}`],
  board: ["#e0f7ef", `<rect x="18" y="26" width="84" height="54" rx="6" fill="#3e8f6f"/><path d="M30 40h28M30 52h18" stroke="#fff" stroke-width="3"/><path d="M40 80l-8 16M80 80l8 16"/>${face(78, 56, .6)}`],
  question: ["#fff6d1", `<path d="M24 30h72a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8H56l-16 14v-14H24a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z" fill="#ffd95e"/><path d="M54 44a7 7 0 1 1 9 7v4" stroke-width="4"/><circle cx="63" cy="64" r="2.5" fill="${INK}"/>`],
  assignment: ["#e3ecff", `<path d="M34 18h38l16 16v66H34z" fill="#fff"/><path d="M72 18v16h16"/><path d="M44 46h32M44 56h24" stroke-width="3"/><path d="M78 86l18-18 6 6-18 18-8 2z" fill="#ffb347"/>${face(56, 74, .55)}`],
  attendance: ["#e0f7ef", `<rect x="30" y="22" width="60" height="78" rx="8" fill="#fff"/><path d="M40 42l5 5 9-9M40 62l5 5 9-9M40 82l5 5 9-9" stroke="#2fb67c"/><path d="M62 44h16M62 64h16M62 84h12" stroke-width="3"/>`],
  vegetables: ["#e8f8de", `<path d="M44 40l30 6-26 50z" fill="#ff9a4d"/><path d="M48 40c-6-8-4-16 0-18M54 40c2-10 10-14 14-12M58 42c8-4 16-2 18 2" stroke="#4caf50"/>${face(58, 58, .6)}`],
  price: ["#fff1d6", `<path d="M64 22h30v30L56 90 26 60z" fill="#ffd95e"/><circle cx="82" cy="34" r="5" fill="#fff"/>${face(58, 58, .7)}`],
  bag: ["#ffe1e1", `<path d="M30 44h60l-6 52H36z" fill="#ff9aa8"/><path d="M46 44v-6a14 14 0 0 1 28 0v6"/>${face(60, 70, .8)}`],
  receipt: ["#f3f3f7", `<path d="M36 18h48v80l-8-6-8 6-8-6-8 6-8-6-8 6z" fill="#fff"/><path d="M46 34h28M46 44h20M46 54h28" stroke-width="3"/>${face(60, 72, .6)}`],
  discount: ["#ffe1e1", `<circle cx="60" cy="60" r="34" fill="#ff7a7a"/><path d="M46 74l28-28" stroke="#fff" stroke-width="4"/><circle cx="48" cy="48" r="5" stroke="#fff"/><circle cx="72" cy="72" r="5" stroke="#fff"/>`],
  checkout: ["#e6f4ff", `<rect x="22" y="58" width="76" height="34" rx="6" fill="#9ed2ff"/><rect x="34" y="26" width="40" height="32" rx="4" fill="#fff"/><rect x="40" y="32" width="28" height="12" rx="2" fill="#7fd8b5"/><path d="M80 58V44h10"/>${face(60, 74, .7)}`],
  room: ["#efe6ff", `<rect x="34" y="18" width="52" height="82" rx="6" fill="#c7b3ff"/><circle cx="76" cy="62" r="4" fill="${INK}"/><rect x="44" y="28" width="32" height="24" rx="3" fill="#fff"/>${face(60, 40, .55)}`],
  washer: ["#e6f4ff", `<rect x="26" y="20" width="68" height="80" rx="10" fill="#fff"/><path d="M26 38h68"/><circle cx="60" cy="68" r="20" fill="#9ed2ff"/><circle cx="38" cy="29" r="2.5" fill="${INK}"/>${face(60, 68, .6)}`],
  key: ["#fff6d1", `<circle cx="42" cy="56" r="20" fill="#ffd95e"/><path d="M62 56h36M86 56v12M96 56v8"/>${face(42, 56, .6)}`],
  cleaning: ["#e8f8de", `<path d="M78 18L58 64"/><path d="M50 60l16 8-8 30-28-14z" fill="#ffd95e"/><path d="M40 82l6 4M48 86l4 2" />`],
  roommate: ["#efe6ff", `<circle cx="44" cy="60" r="22" fill="#ffc46b"/><circle cx="78" cy="62" r="20" fill="#9ed2ff"/>${face(44, 60, .6)}${face(78, 62, .55)}`],
  quiet: ["#e3ecff", `<path d="M78 26a34 34 0 1 0 16 46A28 28 0 0 1 78 26z" fill="#ffd95e"/><path d="M50 62l6-0M64 62l6 0M56 74h8" stroke-width="3"/><path d="M90 30h8l-8 8h8" stroke-width="2.5"/>`],
  rest: ["#efe6ff", `<rect x="22" y="56" width="76" height="26" rx="13" fill="#c7b3ff"/><circle cx="40" cy="52" r="14" fill="#fff"/><path d="M34 52q3 3 6 0M44 52q3 3 6 0" stroke-width="2.5"/><path d="M70 30h10l-10 10h10" stroke-width="3"/>`],
  place: ["#e0f7ef", `<path d="M60 98S30 70 30 48a30 30 0 0 1 60 0c0 22-30 50-30 50z" fill="#7fd8b5"/>${face(60, 48, .8)}`],
  entrance: ["#e8f8de", `<rect x="30" y="20" width="44" height="80" rx="4" fill="#7fd8b5"/><path d="M98 60H80M88 52l-8 8 8 8"/>${face(52, 50, .6)}`],
  exit: ["#ffe1e1", `<rect x="30" y="20" width="44" height="80" rx="4" fill="#ff9aa8"/><path d="M80 60h18M90 52l8 8-8 8"/>${face(52, 50, .6)}`],
  info: ["#e6f4ff", `<circle cx="60" cy="60" r="34" fill="#7fb6ff"/><path d="M60 56v20" stroke="#fff" stroke-width="6"/><circle cx="60" cy="44" r="4" fill="#fff" stroke="none"/>`],
  help: ["#ffe1e1", `<path d="M60 96L28 64a18 18 0 0 1 32-24 18 18 0 0 1 32 24z" fill="#ff8fa3"/>${face(60, 60, .7)}`],
  thanks: ["#fff1d6", `<path d="M30 50h60v44H30z" fill="#ff9aa8"/><rect x="26" y="40" width="68" height="14" rx="3" fill="#ffd95e"/><path d="M60 40v54M60 40c-6-14-22-12-16-2M60 40c6-14 22-12 16-2"/>${face(46, 72, .5)}`],
  // Space thumbnails
  classroom: ["#e0f7ef", `<rect x="16" y="22" width="88" height="46" rx="6" fill="#3e8f6f"/><path d="M28 36h30M28 48h18" stroke="#fff" stroke-width="3"/><rect x="30" y="76" width="60" height="10" rx="3" fill="#d9a066"/><path d="M36 86v14M84 86v14"/>${face(84, 46, .55)}`],
  mart: ["#fff6d1", `<path d="M20 34h12l10 42h48l8-30H38" /><path d="M38 46h60l-8 30H42z" fill="#ffd95e"/><circle cx="48" cy="90" r="6" fill="#fff"/><circle cx="84" cy="90" r="6" fill="#fff"/>${face(68, 60, .6)}`],
  restaurant: ["#ffe9d6", `<path d="M30 48h50v26a20 20 0 0 1-20 20H50a20 20 0 0 1-20-20z" fill="#fff"/><path d="M80 56h6a9 9 0 0 1 0 18h-7"/><ellipse cx="55" cy="48" rx="25" ry="5" fill="#8b5a3c"/>${face(55, 70)}`],
  dormitory: ["#efe6ff", `<path d="M24 54L60 24l36 30v44H24z" fill="#c7b3ff"/><rect x="50" y="70" width="20" height="28" rx="3" fill="#fff"/>${face(60, 52, .6)}`],
  other: ["#e6f4ff", `<path d="M60 98S30 70 30 48a30 30 0 0 1 60 0c0 22-30 50-30 50z" fill="#7fb6ff"/>${face(60, 48, .8)}`],
  // Mascot "틈이": a round dumpling with a sprout
  mascot: ["#fff1e6", `<path d="M60 30c-4-10 2-16 10-16-2 8-6 12-10 16z" fill="#7bd389"/><path d="M60 30c-2-8-10-10-16-6 4 6 10 8 16 6z" fill="#9be3a6"/><path d="M22 74c0-26 16-44 38-44s38 18 38 44c0 14-16 22-38 22S22 88 22 74z" fill="#fff"/><g stroke="none">${face(60, 68, 1.2)}</g>`],
};

for (const [name, [bg, body]] of Object.entries(art)) writeFileSync(new URL(`${name}.svg`, dir), svg(bg, body));
console.log(`wrote ${Object.keys(art).length} illustrations`);

"use client";

/* Photo dimensions and markers always refer to the normalized, uncropped image. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { cultureSources, makeBook, spaces, STORAGE_KEY, type SpaceType, type VocabularyBook, type Word } from "./data";
import { Icon } from "./icons";
import { SwipeDeck } from "./components/swipe-deck";
import type { VocabResponse } from "./api/vocab/route";
import { HomeScreen } from "./components/home-screen";
import { CalendarSheet } from "./components/calendar-sheet";
import starterBooks from "./starter-books.json";

type Screen = "home" | "library" | "capture" | "detail";
type ModalState = { kind: "settings" } | { kind: "calendar" } | { kind: "culture" } | { kind: "scene" } | { kind: "word"; word: Word } | { kind: "delete"; book: VocabularyBook } | null;

function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} aria-label={label} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-inner"><div className="sheet-handle"/><button className="icon-button modal-close" aria-label="닫기" onClick={onClose}><Icon name="close"/></button>{children}</div></dialog>;
}

async function normalizeImage(file: File | Blob, rotation = 0): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url; });
    const ratio = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * ratio), h = Math.round(img.naturalHeight * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = rotation % 180 ? h : w; canvas.height = rotation % 180 ? w : h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally { URL.revokeObjectURL(url); }
}

function isBook(value: unknown): value is VocabularyBook {
  if (!value || typeof value !== "object") return false;
  const b = value as VocabularyBook;
  return typeof b.id === "string" && typeof b.title === "string" && typeof b.imageRef === "string" &&
    spaces.some(s => s.id === b.spaceType) && Array.isArray(b.words) && b.words.length > 0 &&
    b.words.every(w => w && typeof w.korean === "string" && typeof w.translation === "string" && typeof w.exampleKo === "string" && typeof w.exampleTranslated === "string") && Array.isArray(b.cultureNotes);
}

export default function TeumApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [books, setBooks] = useState<VocabularyBook[]>([]);
  const [ready, setReady] = useState(false);
  const [book, setBook] = useState<VocabularyBook | null>(null);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [space, setSpace] = useState<SpaceType | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD, Seoul time
  const [editingTitle, setEditingTitle] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // "live" = Claude API answered; "sample" = no API key on the server, so sample words are used and labelled as such.
  const [aiMode, setAiMode] = useState<"checking" | "live" | "sample" | null>(null);
  const [suggested, setSuggested] = useState<SpaceType | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- One-time hydration from browser-only storage; the initial server and client render must match. */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed) || !parsed.every(isBook)) throw new Error("invalid saved data");
        setBooks(parsed);
      } else {
        // First visit: start with the bundled books already in the library, as if saved.
        const starter = starterBooks as VocabularyBook[];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(starter));
        setBooks(starter);
      }
    } catch { setToast("저장한 단어집을 불러오지 못했어요. 브라우저 저장 공간을 확인해 주세요."); }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3800); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  function navigate(next: Screen) { setScreen(next); setError(""); }
  function openBook(next: VocabularyBook) { setBook(next); setStudyIndex(0); setFlipped(false); setEditingTitle(false); navigate("detail"); }
  function sample(type: SpaceType = "restaurant") { openBook(makeBook(type)); }
  function persist(next: VocabularyBook[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setBooks(next); return true; }
    catch { setToast("저장 공간이 부족해요. 기존 단어집을 정리한 뒤 다시 저장해 주세요. 편집 내용은 유지돼요."); return false; }
  }
  function saveBook() {
    if (!book || !book.title.trim() || !book.words.length) { setToast("제목과 단어가 하나 이상 필요해요."); return; }
    const next = { ...book, title: book.title.trim(), updatedAt: new Date().toISOString() };
    if (persist([next, ...books.filter(b => b.id !== next.id)])) { setBook(next); setToast("저장했습니다."); }
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setToast("이 브라우저는 발음 재생을 지원하지 않아요."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "ko-KR"; utterance.rate = 0.82;
    const voices = window.speechSynthesis.getVoices();
    const korean = voices.find(v => v.lang.toLowerCase().startsWith("ko"));
    if (korean) utterance.voice = korean;
    utterance.onerror = e => { if (e.error !== "interrupted" && e.error !== "canceled") setToast("한국어 음성을 재생하지 못했어요. 기기의 음성 설정을 확인하고 다시 눌러 주세요."); };
    window.speechSynthesis.speak(utterance);
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("JPG, PNG, WebP 사진을 선택해 주세요."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("10MB 이하의 사진을 선택해 주세요."); return; }
    setBusy(true); setError("");
    let image: string;
    try { image = await normalizeImage(file); setPhoto(image); setSpace(null); setSuggested(null); }
    catch { setError("사진을 열 수 없어요. 다른 사진을 선택해 주세요."); setBusy(false); return; }
    setBusy(false);
    analyze(image);
  }
  async function analyze(image: string) {
    if (aiMode === "sample") return;
    setAiMode("checking");
    try {
      const res = await fetch("/api/vocab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "analyze", image }) });
      if (res.status === 503) { setAiMode("sample"); return; }
      if (!res.ok) { setAiMode("live"); return; } // analysis is only a hint; the user still picks the space
      const data = await res.json() as { spaceType: SpaceType; confident: boolean };
      setAiMode("live"); setSuggested(data.spaceType);
      if (data.confident) setSpace(current => current ?? data.spaceType);
    } catch { setAiMode(null); }
  }
  async function rotate() {
    if (!photo) return; setBusy(true);
    try { const blob = await (await fetch(photo)).blob(); setPhoto(await normalizeImage(blob, 90)); }
    catch { setError("사진을 회전하지 못했어요. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  async function generate() {
    if (!space || !photo || busy) return;
    setBusy(true); setError("");
    const base = makeBook(space, photo, description);
    try {
      if (aiMode !== "sample") {
        const res = await fetch("/api/vocab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "generate", image: photo, spaceType: space, description }) });
        if (res.ok) {
          const data = await res.json() as VocabResponse;
          openBook({ ...base, title: data.title, words: data.words, cultureNotes: data.cultureNotes, sample: false, aiModel: data.aiModel });
          return;
        }
        if (res.status !== 503) { setError(res.status === 429 ? "요청이 많아요. 잠시 후 다시 시도해 주세요." : "단어집을 만들지 못했어요. 다시 시도해 주세요."); return; }
        setAiMode("sample");
      }
      openBook(base);
      setToast("AI가 연결되지 않아 샘플 단어로 만들었어요. 사진 분석 결과가 아니에요.");
    } catch { setError("네트워크 오류로 단어집을 만들지 못했어요. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  function selectWord(word: Word) {
    if (!book) return;
    setStudyIndex(Math.max(0, book.words.findIndex(w => w.id === word.id)));
    setFlipped(false);
    setModal(null);
  }
  const wordIndex = Math.min(studyIndex, (book?.words.length ?? 1) - 1);
  const filtered = books.filter(b => (!date || seoulDate(b.createdAt) === date) && `${b.title} ${b.words.map(w => `${w.korean} ${w.translation}`).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const bookCounts = new Map<string, number>();
  for (const b of books) { const d = seoulDate(b.createdAt); bookCounts.set(d, (bookCounts.get(d) ?? 0) + 1); }
  const saved = !!book && books.some(b => b.id === book.id);
  const hasChanges = saved && JSON.stringify(books.find(b => b.id === book?.id)) !== JSON.stringify(book);

  return <>
    <div className={`app-shell screen-${screen}`}>
      <header className="app-header">
        {screen === "home" || screen === "library" ? <button className="brand" onClick={() => navigate("home")} aria-label="틈틈 홈"><img src="/illustrations/mascot.svg" alt="" width={34} height={34}/>틈틈</button> : <button className="icon-button" aria-label="뒤로 가기" onClick={() => navigate("home")}><Icon name="back"/></button>}
        <button className="language-button" onClick={() => setModal({ kind: "settings" })} aria-label="학습 언어와 앱 정보"><Icon name="globe" size={17}/><span>EN</span><Icon name="down" size={12}/></button>
      </header>

      <main id="main">
      {screen === "home" && <HomeScreen books={books} onCapture={() => navigate("capture")} onSample={() => sample()} onOpen={openBook}/>}

      {screen === "capture" && <section className="capture-page page-enter content-pad">
        <div className="step-label"><span className={!photo ? "current" : "done"}>사진 선택</span><span className="step-line"/><span className={photo ? "current" : ""}>공간 확인</span></div>
        <h1 className="page-title">{photo ? "공간 선택" : "사진 추가"}</h1>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} className="hidden-input" aria-label="갤러리 사진 선택"/>
        <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={upload} className="hidden-input" aria-label="카메라로 사진 촬영"/>
        {!photo ? <>
          <div className="capture-hero"><img src="/illustrations/mascot.svg" alt="" width={120} height={120}/><p>교실, 마트, 카페… 지금 있는 곳을 찍어 보세요.</p></div>
          <button className="button button-dark" onClick={() => cameraRef.current?.click()} disabled={busy}><Icon name="camera"/>촬영</button>
          <button className="button button-outline" onClick={() => fileRef.current?.click()} disabled={busy}><Icon name="image"/>앨범에서 고르기</button>
          <p className="privacy-note"><Icon name="info" size={15}/>JPG · PNG · WebP · 최대 10MB<br/>사진에 개인정보가 포함되지 않도록 확인해 주세요.</p>
          <button className="sample-link" onClick={() => sample()}>예시 열기 <Icon name="arrow" size={15}/></button>
        </> : <>
          <div className="preview-photo"><img src={photo} alt="선택한 공간 사진"/><div className="preview-controls"><button onClick={rotate} disabled={busy}><Icon name="rotate" size={16}/>회전</button><button onClick={() => fileRef.current?.click()} disabled={busy}><Icon name="image" size={16}/>사진 변경</button></div></div>
          <h2 className="form-label">어떤 공간인가요?{aiMode === "checking" && <span className="ai-chip"><span className="spinner"/>AI가 보는 중</span>}{suggested && aiMode === "live" && <span className="ai-chip">AI 추천 · {spaces.find(s => s.id === suggested)?.name}</span>}</h2>
          <div className="space-options">{spaces.map(s => <button key={s.id} onClick={() => setSpace(s.id)} className={space === s.id ? "selected" : ""} aria-pressed={space === s.id} style={{ "--tint": s.tint } as CSSProperties}><img src={s.photo} alt="" width={40} height={40}/>{s.name}{space === s.id && <Icon name="check" size={16}/>}</button>)}</div>
          {space === "other" && <label className="field-label">공간을 알려주세요 <span>(선택)</span><input maxLength={80} placeholder="예: 학교 앞 문구점" value={description} onChange={e => setDescription(e.target.value)}/></label>}
          {aiMode === "sample" ? <div className="sample-notice"><Icon name="info" size={18}/><div><strong>샘플 모드</strong><p>서버에 AI 키가 없어 사진 분석 없이 공간별 예시 단어를 제공해요.</p></div></div>
            : <div className="sample-notice live"><Icon name="sparkle" size={18}/><div><strong>AI 분석</strong><p>사진에서 보이는 사물과 함께 배우면 좋은 단어를 골라요.</p></div></div>}
          <button className="button button-dark" onClick={generate} disabled={!space || busy}>{busy ? <><span className="spinner"/>단어 카드를 만들고 있어요</> : <>단어집 만들기<Icon name="arrow" size={18}/></>}</button>
        </>}
        {error && <p className="error-message" role="alert">{error}</p>}
      </section>}

      {screen === "library" && <section className="library-page page-enter content-pad">
        <div className="library-heading"><h1 className="page-title">내 단어집</h1><div className="collection-count">{books.length}<small>개 단어집</small></div></div>
        <div className="search-row"><label className="search-box"><Icon name="search" size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="공간, 한국어, 영어로 찾아보기" aria-label="단어집 검색"/>{query && <button className="icon-button" onClick={() => setQuery("")} aria-label="검색 지우기"><Icon name="close" size={16}/></button>}</label>
        <button className={`calendar-button ${date ? "active" : ""}`} aria-label="달력에서 날짜로 찾기" onClick={() => setModal({ kind: "calendar" })}><Icon name="calendar" size={20}/></button></div>
        {date && <button className="date-pill" onClick={() => setDate("")} aria-label="날짜 선택 해제">{Number(date.slice(5, 7))}월 {Number(date.slice(8))}일<Icon name="close" size={14}/></button>}
        {!ready ? <div className="empty-state"><span className="spinner"/>단어집을 불러오고 있어요.</div> : filtered.length ? <div className="book-list">{filtered.map(b => <BookRow key={b.id} book={b} onOpen={() => openBook(b)}/>)}</div> : <div className="empty-state"><p>{books.length ? "검색 결과가 없습니다." : "저장한 단어집이 없습니다."}</p><button className="text-button" onClick={() => books.length ? (setQuery(""), setDate("")) : navigate("capture")}>{books.length ? "전체 보기" : "사진 추가"}</button></div>}

      </section>}

      {screen === "detail" && book && <section className="detail-page content-pad">
        <div className="detail-heading">
          <button className="scene-thumbnail" onClick={() => setModal({ kind: "scene" })} aria-label="공간 사진 보기"><img src={book.imageRef} alt="" width={48} height={48}/></button>
          {editingTitle ? <input className="title-input" autoFocus maxLength={60} aria-label="단어집 제목" value={book.title} onChange={e => setBook({ ...book, title: e.target.value })} onBlur={() => { if (!book.title.trim()) setBook({ ...book, title: "단어집" }); setEditingTitle(false); }} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}/> : <h1>{book.title}</h1>}
          <button className="icon-button" onClick={() => setEditingTitle(true)} aria-label="단어집 제목 수정"><Icon name="edit" size={16}/></button>
        </div>
        <SwipeDeck words={book.words} scene={book.imageRef} index={wordIndex} revealed={flipped} onReveal={setFlipped} onIndexChange={next => { setStudyIndex(next); setFlipped(false); }} onEdit={() => setModal({ kind: "word", word: book.words[wordIndex] })} onSpeak={speak}/>
        <div className="detail-footer">
          {!!book.cultureNotes.length && <button className="culture-notice" onClick={() => setModal({ kind: "culture" })} aria-label="한국 문화 보기"><Icon name="info" size={17}/><span>{book.cultureNotes[0].phraseKo}</span><Icon name="chevron" size={16}/></button>}
          <div className="detail-actions"><button className="button button-dark" onClick={saveBook} disabled={saved && !hasChanges}>{saved && !hasChanges ? "저장됨" : "저장"}</button>{saved && <button className="icon-button" onClick={() => setModal({ kind: "delete", book })} aria-label="단어집 삭제"><Icon name="trash" size={18}/></button>}</div>
        </div>
      </section>}

      </main>

      <nav className="bottom-nav" aria-label="주 메뉴"><button className={screen === "home" ? "active" : ""} onClick={() => navigate("home")} aria-current={screen === "home" ? "page" : undefined}><Icon name="home"/><span>홈</span></button><button className={`nav-fab ${screen === "capture" ? "active" : ""}`} onClick={() => navigate("capture")} aria-label="사진 추가"><Icon name="camera" size={24}/></button><button className={screen === "library" ? "active" : ""} onClick={() => navigate("library")} aria-current={screen === "library" ? "page" : undefined}><Icon name="book"/><span>단어집</span></button></nav>
    </div>
    {toast && <div className="toast" role="status"><Icon name="info" size={18}/>{toast}<button onClick={() => setToast("")} aria-label="알림 닫기"><Icon name="close" size={16}/></button></div>}
    {modal?.kind === "settings" && <Modal label="설정" onClose={() => setModal(null)}><h2>설정</h2><div className="settings-language"><span>번역 언어</span><strong>English</strong></div><p className="settings-note">{aiMode === "sample" ? "샘플 모드 · 서버에 AI 키가 설정되지 않았어요." : "사진 분석은 Claude API로 서버에서 처리해요."}<br/>단어집은 이 브라우저에 저장됩니다. 계정 동기화는 아직 없어요.</p><p className="asset-credit">일러스트는 이 프로젝트용으로 직접 제작했어요.<br/>공간 예시 사진: Unsplash</p></Modal>}
    {modal?.kind === "calendar" && <Modal label="날짜로 찾기" onClose={() => setModal(null)}><h2>날짜로 찾기</h2><CalendarSheet counts={bookCounts} value={date} today={seoulDate(new Date().toISOString())} onPick={d => { setDate(d); setModal(null); }}/>{date && <button className="button button-outline" onClick={() => { setDate(""); setModal(null); }}>전체 보기</button>}</Modal>}
    {modal?.kind === "scene" && book && <Modal label="공간 사진" onClose={() => setModal(null)}><h2>공간 사진</h2><div className="marked-photo"><img src={book.imageRef} alt={book.title}/>{book.words.map(w => w.bbox && w.source === "observed" && validBox(w.bbox) && <button key={w.id} className={`photo-marker ${book.words[wordIndex].id === w.id ? "active" : ""}`} style={{ left: `${(w.bbox[0] + w.bbox[2] / 2) * 100}%`, top: `${(w.bbox[1] + w.bbox[3] / 2) * 100}%` }} onClick={() => selectWord(w)} aria-label={`${w.markerNumber}번 ${w.korean} 단어 보기`}>{w.markerNumber}</button>)}</div><p className="settings-note">{book.sample ? "샘플 모드 · 사진 분석 결과가 아니에요." : `AI 분석 · ${book.aiModel ?? ""}`}</p></Modal>}
    {modal?.kind === "culture" && book && <Modal label="한국 문화" onClose={() => setModal(null)}><h2>한국 문화</h2>{book.cultureNotes.map(c => <article className="culture-card" key={c.id}><div className="culture-card-heading"><h3>{c.titleKo}</h3><button className="icon-button" aria-label={`${c.titleKo} 제외`} onClick={() => setBook({ ...book, cultureNotes: book.cultureNotes.filter(n => n.id !== c.id) })}><Icon name="close" size={16}/></button></div><p className="culture-title-en" lang="en">{c.titleTranslated}</p><p>{c.descriptionKo}</p><p className="culture-english" lang="en">{c.descriptionTranslated}</p><button className="culture-phrase" onClick={() => speak(c.phraseKo)}><span><strong>{c.phraseKo}</strong><small lang="en">{c.phraseTranslated}</small></span><Icon name="volume" size={18}/></button><p className="qualification">{c.qualificationKo}<br/><span lang="en">{c.qualificationTranslated}</span></p>{c.sourceIds.map(id => { const source = cultureSources.find(item => item.id === id); return source ? <a key={id} className="source-link" href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : null; })}</article>)}{!book.cultureNotes.length && <p className="settings-note">문화 안내가 없습니다.</p>}</Modal>}

    {modal?.kind === "word" && book && <Modal label="단어 편집" onClose={() => setModal(null)}><WordEditor word={modal.word} canDelete={book.words.length > 1} onSave={updated => { setBook({ ...book, words: book.words.map(w => w.id === updated.id ? updated : w) }); setModal(null); setToast("수정했습니다."); }} onDelete={() => { setBook({ ...book, words: book.words.filter(w => w.id !== modal.word.id) }); setStudyIndex(index => Math.min(index, book.words.length - 2)); setFlipped(false); setModal(null); setToast("제외했습니다."); }}/></Modal>}
    {modal?.kind === "delete" && <Modal label="단어집 삭제 확인" onClose={() => setModal(null)}><h2>단어집 삭제</h2><p className="modal-description">‘{modal.book.title}’의 사진과 단어가 삭제돼요.<br/>삭제한 단어집은 되돌릴 수 없어요.</p><button className="button button-danger" onClick={() => { if (persist(books.filter(b => b.id !== modal.book.id))) { setModal(null); setBook(null); navigate("library"); setToast("단어집을 삭제했어요."); } }}>삭제하기</button><button className="button button-outline" onClick={() => setModal(null)}>취소</button></Modal>}
  </>;
}

function seoulDate(iso: string) { return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }); }
function validBox(box: number[]) { return box.length === 4 && box.every(Number.isFinite) && box.every(v => v >= 0 && v <= 1) && box[2] > 0 && box[3] > 0 && box[0] + box[2] <= 1 && box[1] + box[3] <= 1; }
function BookRow({ book, onOpen }: { book: VocabularyBook; onOpen: () => void }) {
  const space = spaces.find(s => s.id === book.spaceType);
  return <button className="book-row" onClick={onOpen}><img src={book.imageRef} alt="" width="82" height="86" style={{ background: space?.tint }}/><span className="book-row-content"><span className="book-row-space">{space?.name}{book.sample && <small>샘플</small>}</span><strong>{book.title}</strong><span>{book.words.length}개 단어 · {new Date(book.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" })}</span></span><Icon name="chevron" size={17}/></button>;
}
function WordEditor({ word, onSave, onDelete, canDelete }: { word: Word; onSave: (word: Word) => void; onDelete: () => void; canDelete: boolean }) {
  const [draft, setDraft] = useState(word);
  return <form onSubmit={e => { e.preventDefault(); onSave({ ...draft, korean: draft.korean.trim(), translation: draft.translation.trim() }); }}><h2>단어 수정</h2><label className="field-label">한국어<input required maxLength={50} value={draft.korean} onChange={e => setDraft({ ...draft, korean: e.target.value })}/></label><label className="field-label">영어 뜻<input required maxLength={100} value={draft.translation} onChange={e => setDraft({ ...draft, translation: e.target.value })}/></label><label className="field-label">한국어 예문<textarea required maxLength={300} value={draft.exampleKo} onChange={e => setDraft({ ...draft, exampleKo: e.target.value })}/></label><label className="field-label">영어 예문<textarea required maxLength={400} value={draft.exampleTranslated} onChange={e => setDraft({ ...draft, exampleTranslated: e.target.value })}/></label><button type="submit" className="button button-dark" disabled={![draft.korean, draft.translation, draft.exampleKo, draft.exampleTranslated].every(v => v.trim())}><Icon name="check" size={18}/>적용</button><button type="button" className="delete-book" onClick={onDelete} disabled={!canDelete}><Icon name="trash" size={14}/>{canDelete ? "단어 제외" : "마지막 단어는 제외할 수 없어요"}</button></form>;
}

"use client";

/* Photo dimensions and markers always refer to the normalized, uncropped image. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { cultureSources, languages, levels, makeBook, PROFILE_KEY, spaces, STORAGE_KEY, FREE_DAILY_BOOKS, USAGE_KEY, type Language, type Profile, type SpaceType, type VocabularyBook, type Word } from "./data";
import { Icon } from "./icons";
import { SwipeDeck } from "./components/swipe-deck";
import type { VocabResponse } from "./api/vocab/route";
import { HomeScreen } from "./components/home-screen";
import { CalendarSheet } from "./components/calendar-sheet";
import { ProfileFields } from "./components/profile-fields";
import { LangContext, translator, type T } from "./i18n";
import { localizeBook } from "./i18n/content";

type Screen = "home" | "library" | "capture" | "detail";
type ModalState = { kind: "settings" } | { kind: "calendar" } | { kind: "culture" } | { kind: "scene" } | { kind: "pro" } | { kind: "onboarding" } | { kind: "word"; word: Word } | { kind: "delete"; book: VocabularyBook } | null;

// Centered dialog the user has to answer (no close button, Escape and backdrop do nothing).
function Dialog({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="modal modal-center" onCancel={e => e.preventDefault()} aria-label={label}><div className="modal-inner">{children}</div></dialog>;
}

function Modal({ children, onClose, label, closeLabel }: { children: ReactNode; onClose: () => void; label: string; closeLabel: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} aria-label={label} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-inner"><div className="sheet-handle"/><button className="icon-button modal-close" aria-label={closeLabel} onClick={onClose}><Icon name="close"/></button>{children}</div></dialog>;
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
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD, Seoul time
  const [editingTitle, setEditingTitle] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // "live" = Claude API answered; "sample" = no API key on the server, so sample words are used and labelled as such.
  const [aiMode, setAiMode] = useState<"sample" | null>(null);
  const [profile, setProfile] = useState<Profile>({ lang: "en", level: "beginner", plan: "free" });
  const [moreBusy, setMoreBusy] = useState(false);
  const [usage, setUsage] = useState({ date: "", count: 0 });
  const [today, setToday] = useState(""); // Seoul date, set on the client
  const t = translator(profile.lang);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- One-time hydration from browser-only storage; the initial server and client render must match. */
  useEffect(() => {
    let lang: Language = "en";
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") as Profile | null;
      if (saved && languages.some(l => l.code === saved.lang) && levels.some(l => l.id === saved.level)) { lang = saved.lang; setProfile({ ...saved, plan: saved.plan === "pro" ? "pro" : "free" }); }
      else setModal({ kind: "onboarding" });
    } catch { setModal({ kind: "onboarding" }); }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed) || !parsed.every(isBook)) throw new Error("invalid saved data");
        // Earlier versions pre-saved two bundled books (ids "example-…"); they're no longer shipped.
        const kept = parsed.filter(b => !b.id.startsWith("example-"));
        if (kept.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
        setBooks(kept);
      }
    } catch { setToast(translator(lang)("toast.load_failed")); }
    try { const u = JSON.parse(localStorage.getItem(USAGE_KEY) || "null") as { date: string; count: number } | null; if (u && typeof u.count === "number") setUsage(u); } catch { /* starts at 0 */ }
    setToday(seoulDate(new Date().toISOString()));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => { document.documentElement.lang = profile.lang; }, [profile.lang]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3800); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  function navigate(next: Screen) { setScreen(next); setError(""); }
  function openBook(next: VocabularyBook) { setBook(localizeBook(next, profile.lang)); setStudyIndex(0); setFlipped(false); setEditingTitle(false); navigate("detail"); }
  function sample(type: SpaceType = "restaurant") { openBook(makeBook(type)); }
  function saveProfile(next: Profile) {
    setProfile(next);
    setBook(b => b && localizeBook(b, next.lang));
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch { /* the choice still applies for this visit */ }
  }
  function persist(next: VocabularyBook[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setBooks(next); return true; }
    catch { setToast(t("toast.storage_full")); return false; }
  }
  function saveBook() {
    if (!book || !book.title.trim() || !book.words.length) { setToast(t("toast.need_title_word")); return; }
    const next = { ...book, title: book.title.trim(), updatedAt: new Date().toISOString() };
    if (persist([next, ...books.filter(b => b.id !== next.id)])) { setBook(next); setToast(t("toast.saved")); }
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setToast(t("toast.tts_unsupported")); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "ko-KR"; utterance.rate = 0.82;
    const voices = window.speechSynthesis.getVoices();
    const korean = voices.find(v => v.lang.toLowerCase().startsWith("ko"));
    if (korean) utterance.voice = korean;
    utterance.onerror = e => { if (e.error !== "interrupted" && e.error !== "canceled") setToast(t("toast.tts_failed")); };
    window.speechSynthesis.speak(utterance);
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError(t("error.file_type")); return; }
    if (file.size > 10 * 1024 * 1024) { setError(t("error.file_size")); return; }
    setBusy(true); setError("");
    let image: string;
    try { image = await normalizeImage(file); setPhoto(image); }
    catch { setError(t("error.photo_open")); setBusy(false); return; }
    setBusy(false);
  }
  async function rotate() {
    if (!photo) return; setBusy(true);
    try { const blob = await (await fetch(photo)).blob(); setPhoto(await normalizeImage(blob, 90)); }
    catch { setError(t("error.rotate")); }
    finally { setBusy(false); }
  }
  const left = Math.max(0, FREE_DAILY_BOOKS - (usage.date === today ? usage.count : 0));
  async function generate() {
    if (!photo || busy) return;
    if (profile.plan === "free" && aiMode !== "sample" && !left) { setError(t("limit.reached")); setModal({ kind: "pro" }); return; }
    setBusy(true); setError("");
    const base = makeBook("other", photo, description); // sample fallback when no AI key
    try {
      if (aiMode !== "sample") {
        const res = await fetch("/api/vocab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "generate", image: photo, description, lang: profile.lang, level: profile.level }) });
        if (res.ok) {
          const data = await res.json() as VocabResponse;
          const used = { date: today, count: FREE_DAILY_BOOKS - left + 1 };
          setUsage(used);
          try { localStorage.setItem(USAGE_KEY, JSON.stringify(used)); } catch { /* counted for this visit */ }
          openBook({ ...base, spaceType: data.spaceType, title: data.title, words: data.words, cultureNotes: data.cultureNotes, sample: false, aiModel: data.aiModel, translationLanguage: profile.lang });
          return;
        }
        if (res.status !== 503) { setError(res.status === 429 ? t("error.rate_limited") : t("error.generate")); return; }
        setAiMode("sample");
      }
      openBook(base);
      setToast(t("toast.sample_fallback"));
    } catch { setError(t("error.network")); }
    finally { setBusy(false); }
  }
  // Pro: ask for words this book doesn't have yet and append them.
  async function more() {
    if (!book || moreBusy) return;
    if (profile.plan !== "pro") { setModal({ kind: "pro" }); return; }
    setMoreBusy(true);
    try {
      const image = book.imageRef.startsWith("data:image/jpeg") ? book.imageRef : await normalizeImage(await (await fetch(book.imageRef)).blob());
      const res = await fetch("/api/vocab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "more", image, spaceType: book.spaceType, description: book.spaceDescription, lang: profile.lang, level: profile.level, exclude: book.words.map(w => w.korean) }) });
      if (res.status === 503) { setToast(t("toast.more_no_ai")); return; }
      if (!res.ok) { setToast(res.status === 429 ? t("error.rate_limited") : t("toast.more_failed")); return; }
      const { words } = await res.json() as { words: Word[] };
      if (!words.length) { setToast(t("toast.more_none")); return; }
      let marker = Math.max(0, ...book.words.map(w => w.markerNumber ?? 0));
      const added = words.map((w, i) => ({ ...w, id: `w-${crypto.randomUUID().slice(0, 8)}-${i}`, markerNumber: w.markerNumber ? ++marker : null }));
      setBook({ ...book, words: [...book.words, ...added] });
      setStudyIndex(book.words.length); setFlipped(false);
      setToast(t("toast.more_added", { n: added.length }));
    } catch { setToast(t("toast.more_network")); }
    finally { setMoreBusy(false); }
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
  const stored = books.find(b => b.id === book?.id);
  const hasChanges = saved && !!stored && JSON.stringify(localizeBook(stored, profile.lang)) !== JSON.stringify(book);

  return <LangContext.Provider value={profile.lang}>
    <div className={`app-shell screen-${screen}`}>
      <header className="app-header">
        {screen === "home" || screen === "library" ? <button className="brand" onClick={() => navigate("home")} aria-label={t("home_label")}><span className="brand-mark" aria-hidden="true"/>틈틈<i className="brand-latin" lang="en">teumteum</i></button> : <button className="icon-button" aria-label={t("back")} onClick={() => navigate("home")}><Icon name="back"/></button>}
        <button className="language-button" onClick={() => setModal({ kind: "settings" })} aria-label={t("settings_label")}><Icon name="globe" size={17}/><span>{profile.lang.toUpperCase()}</span><Icon name="down" size={12}/></button>
      </header>

      <main id="main">
      {screen === "home" && <HomeScreen books={books} onCapture={() => navigate("capture")} onSample={() => sample()} onOpen={openBook}/>}

      {screen === "capture" && <section className="capture-page page-enter content-pad">
        <h1 className="page-title">{photo ? t("capture.title_ready") : t("capture.title_photo")}</h1>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} className="hidden-input" aria-label={t("capture.gallery_input")}/>
        <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={upload} className="hidden-input" aria-label={t("capture.camera_input")}/>
        {!photo ? <>
          <div className="capture-hero"><span className="viewfinder" aria-hidden="true"><Icon name="camera" size={28}/></span><p>{t("capture.hint")}</p></div>
          <button className="button button-dark" onClick={() => cameraRef.current?.click()} disabled={busy}><Icon name="camera"/>{t("capture.shoot")}</button>
          <button className="button button-outline" onClick={() => fileRef.current?.click()} disabled={busy}><Icon name="image"/>{t("capture.album")}</button>
          <p className="privacy-note"><Icon name="info" size={15}/>{t("capture.limits")}<br/>{t("capture.privacy")}</p>
          <button className="sample-link" onClick={() => sample()}>{t("capture.open_sample")} <Icon name="arrow" size={15}/></button>
        </> : <>
          <div className="preview-photo"><img src={photo} alt={t("capture.photo_alt")}/><div className="preview-controls"><button onClick={rotate} disabled={busy}><Icon name="rotate" size={16}/>{t("capture.rotate")}</button><button onClick={() => fileRef.current?.click()} disabled={busy}><Icon name="image" size={16}/>{t("capture.change")}</button></div></div>
          <label className="field-label"><span className="field-head">{t("capture.describe")}<em>{t("capture.optional")}</em></span><input maxLength={80} placeholder={t("capture.describe_placeholder")} value={description} onChange={e => setDescription(e.target.value)}/></label>
          {aiMode === "sample" ? <div className="sample-notice"><Icon name="info" size={18}/><div><strong>{t("capture.sample_mode")}</strong><p>{t("capture.sample_mode_desc")}</p></div></div>
            : <div className="sample-notice live"><Icon name="sparkle" size={18}/><div><strong>{t("capture.ai_analysis")}</strong><p>{t("capture.ai_analysis_desc")}</p></div></div>}
          {profile.plan === "free" && aiMode !== "sample" && <p className="limit-note">{t("limit.left", { n: left })}</p>}
          <button className="button button-dark" onClick={generate} disabled={busy}>{busy ? <><span className="spinner"/>{t("capture.generating")}</> : <>{t("capture.make_book")}<Icon name="arrow" size={18}/></>}</button>
        </>}
        {error && <p className="error-message" role="alert">{error}</p>}
      </section>}

      {screen === "library" && <section className="library-page page-enter content-pad">
        <div className="library-heading"><h1 className="page-title">{t("library.title")}</h1><div className="collection-count">{books.length}<small>{t("library.unit")}</small></div></div>
        <div className="search-row"><label className="search-box"><Icon name="search" size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("library.search_placeholder")} aria-label={t("library.search_label")}/>{query && <button className="icon-button" onClick={() => setQuery("")} aria-label={t("library.clear_search")}><Icon name="close" size={16}/></button>}</label>
        <button className={`calendar-button ${date ? "active" : ""}`} aria-label={t("library.calendar")} onClick={() => setModal({ kind: "calendar" })}><Icon name="calendar" size={20}/></button></div>
        {date && <button className="date-pill" onClick={() => setDate("")} aria-label={t("library.clear_date")}>{new Date(`${date}T12:00:00Z`).toLocaleDateString(profile.lang, { month: "long", day: "numeric", timeZone: "UTC" })}<Icon name="close" size={14}/></button>}
        {!ready ? <div className="empty-state"><span className="spinner"/>{t("library.loading")}</div> : filtered.length ? <div className="book-list">{filtered.map(b => <BookRow key={b.id} book={b} t={t} lang={profile.lang} onOpen={() => openBook(b)} onDelete={() => setModal({ kind: "delete", book: b })}/>)}</div> : <div className="empty-state"><p>{books.length ? t("library.no_results") : t("library.empty")}</p><button className="text-button" onClick={() => books.length ? (setQuery(""), setDate("")) : navigate("capture")}>{books.length ? t("library.show_all") : t("add_photo")}</button></div>}

      </section>}

      {screen === "detail" && book && <section className="detail-page content-pad">
        <div className="detail-heading">
          <button className="scene-thumbnail" onClick={() => setModal({ kind: "scene" })} aria-label={t("detail.view_photo")}><img src={book.imageRef} alt="" width={48} height={48}/></button>
          {editingTitle ? <input className="title-input" autoFocus maxLength={60} aria-label={t("detail.title_label")} value={book.title} onChange={e => setBook({ ...book, title: e.target.value })} onBlur={() => { if (!book.title.trim()) setBook({ ...book, title: "단어집" }); setEditingTitle(false); }} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}/> : <h1>{book.title}</h1>}
          <button className="icon-button" onClick={() => setEditingTitle(true)} aria-label={t("detail.edit_title")}><Icon name="edit" size={16}/></button>
        </div>
        <SwipeDeck words={book.words} scene={book.imageRef} index={wordIndex} revealed={flipped} onReveal={setFlipped} onIndexChange={next => { setStudyIndex(next); setFlipped(false); }} onEdit={() => setModal({ kind: "word", word: book.words[wordIndex] })} onSpeak={speak} onMore={more} moreBusy={moreBusy}/>
        <div className="detail-footer">
          {!!book.cultureNotes.length && <button className="culture-notice" onClick={() => setModal({ kind: "culture" })} aria-label={t("detail.culture")}><Icon name="info" size={17}/><span><strong lang="ko">{book.cultureNotes[0].phraseKo}</strong><small>{book.cultureNotes[0].phraseTranslated}</small></span><Icon name="chevron" size={16}/></button>}
          <div className="detail-actions"><button className="button button-dark" onClick={saveBook} disabled={saved && !hasChanges}>{saved && !hasChanges ? t("detail.saved") : t("detail.save")}</button>{saved && <button className="icon-button" onClick={() => setModal({ kind: "delete", book })} aria-label={t("detail.delete")}><Icon name="trash" size={18}/></button>}</div>
        </div>
      </section>}

      </main>

      <nav className="bottom-nav" aria-label={t("main_menu")}><button className={screen === "home" ? "active" : ""} onClick={() => navigate("home")} aria-current={screen === "home" ? "page" : undefined}><Icon name="home"/><span>{t("home")}</span></button><button className={`nav-fab ${screen === "capture" ? "active" : ""}`} onClick={() => navigate("capture")} aria-label={t("add_photo")}><Icon name="camera" size={24}/></button><button className={screen === "library" ? "active" : ""} onClick={() => navigate("library")} aria-current={screen === "library" ? "page" : undefined}><Icon name="book"/><span>{t("books")}</span></button></nav>
    </div>
    {toast && <div className="toast" role="status"><Icon name="info" size={18}/>{toast}<button onClick={() => setToast("")} aria-label={t("dismiss")}><Icon name="close" size={16}/></button></div>}
    {modal?.kind === "settings" && <Modal label={t("settings.title")} closeLabel={t("close")} onClose={() => setModal(null)}><h2>{t("settings.title")}</h2><ProfileFields lang={profile.lang} level={profile.level} onChange={next => saveProfile({ ...profile, ...next })}/><div className="settings-language"><span>{t("settings.plan")}</span>{profile.plan === "pro" ? <span className="plan-row"><strong className="pro-tag">PRO</strong><button className="text-button" onClick={() => saveProfile({ ...profile, plan: "free" })}>{t("settings.cancel_plan")}</button></span> : <button className="text-button" onClick={() => setModal({ kind: "pro" })}>{t("settings.see_pro")}</button>}</div><p className="settings-note">{t("settings.applies_new")}</p><p className="settings-note">{aiMode === "sample" ? t("settings.sample_no_key") : t("settings.server_ai")}<br/>{t("settings.local")}</p><p className="asset-credit">{t("settings.credit_illustration")}<br/>{t("settings.credit_photos")}</p></Modal>}
    {modal?.kind === "onboarding" && <Dialog label={t("onboarding.label")}><div className="onboarding">
      <h2>{t("onboarding.title")}</h2>
      <p className="onboarding-lead">{t("onboarding.lead")}</p>
      <ProfileFields lang={profile.lang} level={profile.level} onChange={next => setProfile({ ...profile, ...next })}/>
      <button className="button button-dark" onClick={() => { saveProfile(profile); setModal(null); }}>{t("onboarding.start")}<Icon name="arrow" size={18}/></button>
    </div></Dialog>}
    {modal?.kind === "pro" && <Modal label="Pro" closeLabel={t("close")} onClose={() => setModal(null)}><div className="pro-sheet">
      <span className="pro-tag">PRO</span><h2>{t("pro.title")}</h2>
      <ul className="pro-benefits">
        <li><Icon name="calendar" size={18}/><span><strong>{t("pro.b4")}</strong><small>{t("pro.b4_desc")}</small></span></li>
        <li><Icon name="plus" size={18}/><span><strong>{t("pro.b1")}</strong><small>{t("pro.b1_desc")}</small></span></li>
        <li><Icon name="book" size={18}/><span><strong>{t("pro.b2")}</strong><small>{t("pro.b2_desc")}</small></span></li>
        <li><Icon name="sparkle" size={18}/><span><strong>{t("pro.b3")}</strong><small>{t("pro.b3_desc")}</small></span></li>
      </ul>
      <div className="pro-price"><strong>₩3,900</strong><span>{t("pro.per_month")}</span><small>{t("pro.trial_note")}</small></div>
      <button className="button button-dark" onClick={() => { saveProfile({ ...profile, plan: "pro" }); setModal(null); setToast(t("toast.pro_started")); }}>{t("pro.start")}</button>
      <button className="button button-outline" onClick={() => setModal(null)}>{t("pro.later")}</button>
    </div></Modal>}
    {modal?.kind === "calendar" && <Modal label={t("calendar.title")} closeLabel={t("close")} onClose={() => setModal(null)}><h2>{t("calendar.title")}</h2><CalendarSheet counts={bookCounts} value={date} today={today} onPick={d => { setDate(d); setModal(null); }}/>{date && <button className="button button-outline" onClick={() => { setDate(""); setModal(null); }}>{t("library.show_all")}</button>}</Modal>}
    {modal?.kind === "scene" && book && <Modal label={t("scene.title")} closeLabel={t("close")} onClose={() => setModal(null)}><h2>{t("scene.title")}</h2><div className="marked-photo"><img src={book.imageRef} alt={book.title}/>{book.words.map(w => w.bbox && w.source === "observed" && validBox(w.bbox) && <button key={w.id} className={`photo-marker ${book.words[wordIndex].id === w.id ? "active" : ""}`} style={{ left: `${(w.bbox[0] + w.bbox[2] / 2) * 100}%`, top: `${(w.bbox[1] + w.bbox[3] / 2) * 100}%` }} onClick={() => selectWord(w)} aria-label={t("scene.marker", { n: w.markerNumber ?? "", word: w.korean })}>{w.markerNumber}</button>)}</div>{book.sample && <p className="settings-note">{t("scene.sample")}</p>}</Modal>}
    {modal?.kind === "culture" && book && <Modal label={t("culture.title")} closeLabel={t("close")} onClose={() => setModal(null)}><h2>{t("culture.title")}</h2>{book.cultureNotes.map(c => <article className="culture-card" key={c.id}><div className="culture-card-heading"><h3>{c.titleKo}</h3><button className="icon-button" aria-label={t("culture.remove", { name: c.titleKo })} onClick={() => setBook({ ...book, cultureNotes: book.cultureNotes.filter(n => n.id !== c.id) })}><Icon name="close" size={16}/></button></div><p className="culture-title-en">{c.titleTranslated}</p><p>{c.descriptionKo}</p><p className="culture-english">{c.descriptionTranslated}</p><button className="culture-phrase" onClick={() => speak(c.phraseKo)}><span><strong>{c.phraseKo}</strong><small>{c.phraseTranslated}</small></span><Icon name="volume" size={18}/></button>{c.qualificationKo && <p className="qualification">{c.qualificationKo}<br/><span>{c.qualificationTranslated}</span></p>}{c.sourceIds.map(id => { const source = cultureSources.find(item => item.id === id); return source ? <a key={id} className="source-link" href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : null; })}</article>)}{!book.cultureNotes.length && <p className="settings-note">{t("culture.empty")}</p>}</Modal>}

    {modal?.kind === "word" && book && <Modal label={t("word.edit_label")} closeLabel={t("close")} onClose={() => setModal(null)}><WordEditor t={t} word={modal.word} canDelete={book.words.length > 1} onSave={updated => { setBook({ ...book, words: book.words.map(w => w.id === updated.id ? updated : w) }); setModal(null); setToast(t("toast.edited")); }} onDelete={() => { setBook({ ...book, words: book.words.filter(w => w.id !== modal.word.id) }); setStudyIndex(index => Math.min(index, book.words.length - 2)); setFlipped(false); setModal(null); setToast(t("toast.removed")); }}/></Modal>}
    {modal?.kind === "delete" && <Modal label={t("delete.label")} closeLabel={t("close")} onClose={() => setModal(null)}><h2>{t("delete.title")}</h2><p className="modal-description">{t("delete.desc", { title: modal.book.title })}<br/>{t("delete.irreversible")}</p><button className="button button-danger" onClick={() => { if (persist(books.filter(b => b.id !== modal.book.id))) { setModal(null); setBook(null); navigate("library"); setToast(t("toast.deleted")); } }}>{t("delete.action")}</button><button className="button button-outline" onClick={() => setModal(null)}>{t("delete.cancel")}</button></Modal>}
  </LangContext.Provider>;
}

function seoulDate(iso: string) { return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }); }
function validBox(box: number[]) { return box.length === 4 && box.every(Number.isFinite) && box.every(v => v >= 0 && v <= 1) && box[2] > 0 && box[3] > 0 && box[0] + box[2] <= 1 && box[1] + box[3] <= 1; }
function BookRow({ book, onOpen, onDelete, t, lang }: { book: VocabularyBook; onOpen: () => void; onDelete: () => void; t: T; lang: string }) {
  const space = spaces.find(s => s.id === book.spaceType);
  return <div className="book-row-wrap"><button className="book-row" onClick={onOpen}><img src={book.imageRef} alt="" width="82" height="86" style={{ background: space?.tint }}/><span className="book-row-content"><span className="book-row-space">{t(`space.${book.spaceType}`)}{book.sample && <small>{t("library.sample")}</small>}</span><strong>{book.title}</strong><span>{t("word_count", { n: book.words.length })} · {new Date(book.createdAt).toLocaleDateString(lang, { month: "long", day: "numeric", timeZone: "Asia/Seoul" })}</span></span></button><button className="icon-button book-row-delete" onClick={onDelete} aria-label={`${t("detail.delete")} · ${book.title}`}><Icon name="trash" size={17}/></button></div>;
}
function WordEditor({ word, onSave, onDelete, canDelete, t }: { word: Word; onSave: (word: Word) => void; onDelete: () => void; canDelete: boolean; t: T }) {
  const [draft, setDraft] = useState(word);
  return <form onSubmit={e => { e.preventDefault(); onSave({ ...draft, korean: draft.korean.trim(), translation: draft.translation.trim() }); }}><h2>{t("word.edit_title")}</h2><label className="field-label">{t("word.korean")}<input required maxLength={50} value={draft.korean} onChange={e => setDraft({ ...draft, korean: e.target.value })}/></label><label className="field-label">{t("word.meaning")}<input required maxLength={100} value={draft.translation} onChange={e => setDraft({ ...draft, translation: e.target.value })}/></label><label className="field-label">{t("word.example_ko")}<textarea required maxLength={300} value={draft.exampleKo} onChange={e => setDraft({ ...draft, exampleKo: e.target.value })}/></label><label className="field-label">{t("word.example_translation")}<textarea required maxLength={400} value={draft.exampleTranslated} onChange={e => setDraft({ ...draft, exampleTranslated: e.target.value })}/></label><button type="submit" className="button button-dark" disabled={![draft.korean, draft.translation, draft.exampleKo, draft.exampleTranslated].every(v => v.trim())}><Icon name="check" size={18}/>{t("word.apply")}</button><button type="button" className="delete-book" onClick={onDelete} disabled={!canDelete}><Icon name="trash" size={14}/>{canDelete ? t("word.remove") : t("word.last")}</button></form>;
}

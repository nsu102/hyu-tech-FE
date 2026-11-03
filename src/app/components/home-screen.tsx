/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { spaces, type VocabularyBook } from "../data";
import { Icon } from "../icons";
import exampleBooks from "../example-books.json";

// Real AI-generated books bundled as examples. Hidden once the user has a saved copy (same id or title).
const examples = exampleBooks as VocabularyBook[];

export function HomeScreen({ books, onCapture, onSample, onOpen }: {
  books: VocabularyBook[];
  onCapture: () => void;
  onSample: () => void;
  onOpen: (book: VocabularyBook) => void;
}) {
  return <section className="home-page page-enter">
    <button className="hero-card" onClick={onCapture}>
      <span className="hero-text">
        <strong>공간을 찍으면<br/>단어집이 생겨요</strong>
        <span className="hero-cta"><Icon name="camera" size={17}/>사진 찍기</span>
      </span>
      <img src="/illustrations/mascot.svg" alt="" width={112} height={112} className="hero-mascot"/>
    </button>

    <div className="section-heading"><h1>내 단어집</h1><button className="icon-button soft" aria-label="새 단어집" onClick={onCapture}><Icon name="plus" size={20}/></button></div>
    <div className="book-grid">
      {books.map(book => <BookCard key={book.id} book={book} onOpen={() => onOpen(book)}/>)}
      {examples.filter(ex => !books.some(b => b.id === ex.id || b.title === ex.title)).map(ex => <BookCard key={ex.id} book={ex} example onOpen={() => onOpen({ ...ex, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })}/>)}
      <button className="book-card sample" onClick={onSample} style={{ "--tint": "#ffe9d6" } as CSSProperties}>
        <span className="book-card-art"><img src="/images/cafe.jpg" alt="" width={160} height={120}/></span>
        <span className="book-card-meta"><span className="badge">예시</span><strong>카페</strong><small>8개 단어</small></span>
      </button>
    </div>
    {!books.length && <p className="home-empty">아직 저장한 단어집이 없어요.<br/>예시 단어집부터 둘러보세요.</p>}
  </section>;
}

function BookCard({ book, onOpen, example = false }: { book: VocabularyBook; onOpen: () => void; example?: boolean }) {
  const space = spaces.find(s => s.id === book.spaceType);
  return <button className="book-card" onClick={onOpen} style={{ "--tint": space?.tint } as CSSProperties}>
    <span className="book-card-art"><img src={book.imageRef} alt="" width={160} height={120}/></span>
    <span className="book-card-meta"><span className="badge">{example ? "예시" : space?.name}</span><strong>{book.title}</strong><small>{book.words.length}개 단어</small></span>
  </button>;
}

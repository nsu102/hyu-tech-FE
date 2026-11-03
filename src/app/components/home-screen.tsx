/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { spaces, type VocabularyBook } from "../data";
import { Icon } from "../icons";
import { useI18n } from "../i18n";

export function HomeScreen({ books, onCapture, onSample, onOpen }: {
  books: VocabularyBook[];
  onCapture: () => void;
  onSample: () => void;
  onOpen: (book: VocabularyBook) => void;
}) {
  const { t } = useI18n();
  return <section className="home-page page-enter">
    <button className="hero-card" onClick={onCapture}>
      <span className="hero-text">
        <strong className="pre-line">{t("home.hero")}</strong>
        <span className="hero-cta"><Icon name="camera" size={17}/>{t("home.take_photo")}</span>
      </span>
      <img src="/illustrations/mascot.svg" alt="" width={112} height={112} className="hero-mascot"/>
    </button>

    <div className="section-heading"><h1>{t("library.title")}</h1><button className="icon-button soft" aria-label={t("home.new_book")} onClick={onCapture}><Icon name="plus" size={20}/></button></div>
    <div className="book-grid">
      {books.map(book => <BookCard key={book.id} book={book} onOpen={() => onOpen(book)}/>)}
      <button className="book-card sample" onClick={onSample} style={{ "--tint": "#ffe9d6" } as CSSProperties}>
        <span className="book-card-art"><img src="/images/cafe.jpg" alt="" width={160} height={120}/></span>
        <span className="book-card-meta"><span className="badge">{t("home.example")}</span><strong>카페</strong><small>{t("word_count", { n: 8 })}</small></span>
      </button>
    </div>
    {!books.length && <p className="home-empty pre-line">{t("home.empty")}</p>}
  </section>;
}

function BookCard({ book, onOpen }: { book: VocabularyBook; onOpen: () => void }) {
  const { t } = useI18n();
  const space = spaces.find(s => s.id === book.spaceType);
  return <button className="book-card" onClick={onOpen} style={{ "--tint": space?.tint } as CSSProperties}>
    <span className="book-card-art"><img src={book.imageRef} alt="" width={160} height={120}/></span>
    <span className="book-card-meta"><span className="badge">{t(`space.${book.spaceType}`)}</span><strong>{book.title}</strong><small>{t("word_count", { n: book.words.length })}</small></span>
  </button>;
}

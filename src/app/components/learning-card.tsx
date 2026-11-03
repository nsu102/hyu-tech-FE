"use client";
import type { Word } from "../data";
import { Icon } from "../icons";
import { WordPhoto } from "./word-photo";

export function LearningCard({ word, scene, revealed, onReveal, onSpeak }: {
  word: Word; scene: string; revealed: boolean;
  onReveal: (revealed: boolean) => void; onSpeak: (text: string) => void;
}) {
  return <article className={`learning-card ${revealed ? "is-revealed" : ""}`} aria-label={`${word.korean} 단어 카드`}>
    <span className={`source-badge ${word.source}`}>{word.markerNumber ? <b>{word.markerNumber}</b> : null}{word.source === "observed" ? "사진에서 찾음" : "함께 배우기"}</span>
    <button className="learning-card-flip" type="button" onClick={() => onReveal(!revealed)} aria-label={`${word.korean} ${revealed ? "뜻 숨기기" : "뜻 보기"}`} aria-expanded={revealed}>
      <WordPhoto word={word} scene={scene} className="learning-card-photo" eager/>
      <span className="learning-card-korean">{word.korean}</span>
      {word.roman && <span className="learning-card-roman" lang="en">{word.roman}</span>}
      {revealed ? <span className="learning-card-answer"><strong lang="en">{word.translation}</strong><span className="example"><span>{word.exampleKo}</span><small lang="en">{word.exampleTranslated}</small></span></span>
        : <span className="tap-hint">탭해서 뜻 보기</span>}
    </button>
    <button type="button" className="sound-button card-sound" onClick={() => onSpeak(word.korean)} aria-label={`${word.korean} 발음 듣기`}><Icon name="volume" size={20}/></button>
  </article>;
}

"use client";
import type { Word } from "../data";
import { Icon } from "../icons";
import { WordPhoto } from "./word-photo";
import { useI18n } from "../i18n";

export function LearningCard({ word, scene, revealed, onReveal, onSpeak }: {
  word: Word; scene: string; revealed: boolean;
  onReveal: (revealed: boolean) => void; onSpeak: (text: string) => void;
}) {
  const { t } = useI18n();
  return <article className={`learning-card ${revealed ? "is-revealed" : ""}`} aria-label={t("card.label", { word: word.korean })}>
    <span className={`source-badge ${word.source}`}>{word.markerNumber ? <b>{word.markerNumber}</b> : null}{t(`source.${word.source}`)}</span>
    <button className="learning-card-flip" type="button" onClick={() => onReveal(!revealed)} aria-label={t(revealed ? "card.hide" : "card.show", { word: word.korean })} aria-expanded={revealed}>
      <WordPhoto word={word} scene={scene} className="learning-card-photo" eager/>
      <span lang="ko" className={`learning-card-korean ${word.korean.length > 8 ? "is-long" : ""}`}>{word.korean}</span>
      {word.roman && <span className="learning-card-roman">{word.roman}</span>}
      {revealed ? <span className="learning-card-answer"><strong>{word.translation}</strong><span className="example"><span lang="ko">{word.exampleKo}</span><small>{word.exampleTranslated}</small></span></span>
        : <span className="tap-hint">{t("card.tap_hint")}</span>}
    </button>
    <button type="button" className="sound-button card-sound" onClick={() => onSpeak(word.korean)} aria-label={t("card.listen", { word: word.korean })}><Icon name="volume" size={20}/></button>
  </article>;
}

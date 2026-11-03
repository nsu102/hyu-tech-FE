"use client";
import { languages, levels, type Language, type Level } from "../data";
import { Icon } from "../icons";
import { useI18n } from "../i18n";

// Shared by onboarding and settings: the learner's own language and Korean level.
export function ProfileFields({ lang, level, onChange }: {
  lang: Language; level: Level; onChange: (next: { lang: Language; level: Level }) => void;
}) {
  const { t } = useI18n();
  return <>
    <fieldset className="choice-group">
      <legend>{t("profile.language")}</legend>
      <div className="lang-grid">{languages.map(l => <button type="button" key={l.code} className={lang === l.code ? "selected" : ""} aria-pressed={lang === l.code} onClick={() => onChange({ lang: l.code, level })}>{l.name}</button>)}</div>
    </fieldset>
    <fieldset className="choice-group">
      <legend>{t("profile.level")}</legend>
      <div className="level-list">{levels.map(l => <button type="button" key={l.id} className={level === l.id ? "selected" : ""} aria-pressed={level === l.id} onClick={() => onChange({ lang, level: l.id })}>
        <span><strong>{t(`level.${l.id}`)}</strong><small>{t(`level.${l.id}.hint`)}</small></span>{level === l.id && <Icon name="check" size={18}/>}
      </button>)}</div>
    </fieldset>
  </>;
}

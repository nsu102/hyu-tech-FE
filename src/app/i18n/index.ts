import { createContext, useContext } from "react";
import type { Language } from "../data";
import en from "./en.json";
import zh from "./zh.json";
import ja from "./ja.json";
import vi from "./vi.json";
import mn from "./mn.json";
import uz from "./uz.json";
import es from "./es.json";
import fr from "./fr.json";

// UI text follows the learner's own language; Korean learning content stays Korean.
export type MessageKey = keyof typeof en;
const messages: Record<Language, Record<MessageKey, string>> = { en, zh, ja, vi, mn, uz, es, fr };

export function translator(lang: Language) {
  const dict = messages[lang] ?? en;
  return (key: MessageKey, vars: Record<string, string | number> = {}) =>
    (dict[key] ?? en[key]).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
export type T = ReturnType<typeof translator>;

export const LangContext = createContext<Language>("en");
export function useI18n() { const lang = useContext(LangContext); return { lang, t: translator(lang) }; }

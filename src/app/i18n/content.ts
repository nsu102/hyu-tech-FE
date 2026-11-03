import type { Language, VocabularyBook } from "../data";
import zh from "./content/zh.json";
import ja from "./content/ja.json";
import vi from "./content/vi.json";
import mn from "./content/mn.json";
import uz from "./content/uz.json";
import es from "./content/es.json";
import fr from "./content/fr.json";

// Built-in content (starter books, samples, reviewed culture notes) is written in English; these map each
// English string to the learner's language. AI-made books are already in the right language and pass through.
const content: Record<Exclude<Language, "en">, Record<string, string>> = { zh, ja, vi, mn, uz, es, fr };
const english = new Map<string, string>(); // any known text, in any language → its English original
for (const dict of Object.values(content)) for (const [en, text] of Object.entries(dict)) { english.set(en, en); english.set(text, en); }

export function localizeText(text: string | undefined, lang: Language) {
  const en = text && english.get(text);
  if (!en) return text; // user-edited or AI text
  return lang === "en" ? en : content[lang][en] ?? text;
}

export function localizeBook(book: VocabularyBook, lang: Language): VocabularyBook {
  return {
    ...book,
    words: book.words.map(w => ({ ...w, translation: localizeText(w.translation, lang)!, exampleTranslated: localizeText(w.exampleTranslated, lang)! })),
    cultureNotes: book.cultureNotes.map(c => ({
      ...c, titleTranslated: localizeText(c.titleTranslated, lang)!, descriptionTranslated: localizeText(c.descriptionTranslated, lang)!,
      phraseTranslated: localizeText(c.phraseTranslated, lang)!, qualificationTranslated: localizeText(c.qualificationTranslated, lang),
    })),
  };
}

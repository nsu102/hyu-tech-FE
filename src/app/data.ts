export type SpaceType = "classroom" | "mart" | "restaurant" | "dormitory" | "other";
export const spaceTypes = ["classroom", "mart", "restaurant", "dormitory", "other"] as const;
// Files in public/illustrations (scripts/illustrations.mjs). The API may only pick from this list.
export const iconKeys = ["apple", "assignment", "attendance", "bag", "bed", "board", "book", "chair", "checkout", "classroom", "cleaning", "coffee", "desk", "discount", "dormitory", "entrance", "exit", "help", "info", "key", "lamp", "mart", "menu", "milk", "order", "other", "pay", "place", "price", "question", "quiet", "receipt", "rest", "restaurant", "room", "roommate", "sign", "takeout", "thanks", "vegetables", "washer"] as const;
export type IconKey = typeof iconKeys[number];
export type BBox = [number, number, number, number];
export type Word = {
  id: string; korean: string; translation: string; roman: string;
  exampleKo: string; exampleTranslated: string;
  source: "observed" | "related" | "expression"; bbox: BBox | null; markerNumber: number | null; iconKey: IconKey | null; photoKey?: string;
  imageRef?: string; imageOrigin?: "generated" | "reference"; imageStatus?: "pending" | "ready" | "failed";
};
export type CultureNote = {
  id: string; titleKo: string; titleTranslated: string; descriptionKo: string; descriptionTranslated: string;
  phraseKo: string; phraseTranslated: string; qualificationKo?: string; qualificationTranslated?: string; sourceIds: string[];
};
export type VocabularyBook = {
  id: string; title: string; spaceType: SpaceType; spaceDescription: string; translationLanguage: string;
  imageRef: string; words: Word[]; cultureNotes: CultureNote[]; createdAt: string; updatedAt: string; sample: boolean; aiModel?: string;
};
export const spaces: { id: SpaceType; name: string; english: string; photo: string; tint: string }[] = [
  { id: "classroom", name: "교실", english: "Classroom", photo: "/illustrations/classroom.svg", tint: "#e0f7ef" },
  { id: "mart", name: "마트", english: "Market", photo: "/illustrations/mart.svg", tint: "#fff6d1" },
  { id: "restaurant", name: "식당·카페", english: "Café & dining", photo: "/illustrations/restaurant.svg", tint: "#ffe9d6" },
  { id: "dormitory", name: "기숙사", english: "Dormitory", photo: "/illustrations/dormitory.svg", tint: "#efe6ff" },
  { id: "other", name: "다른 공간", english: "Somewhere else", photo: "/illustrations/other.svg", tint: "#e6f4ff" },
];
type WordSeed = [string, string, string, string, string, IconKey, BBox?];
const seeds: Record<SpaceType, WordSeed[]> = {
  restaurant: [
    ["조명", "Light", "jomyeong", "조명이 따뜻해요.", "The lighting is warm.", "lamp", [0.48, 0.6, 0.12, 0.2]],
    ["메뉴판", "Menu", "menyupan", "메뉴판을 보여 주세요.", "Please show me the menu.", "menu", [0.67, 0.61, 0.14, 0.25]],
    ["간판", "Sign", "ganpan", "카페 간판이 보여요.", "I can see the café sign.", "sign", [0.6, 0.28, 0.32, 0.35]],
    ["커피", "Coffee", "keopi", "커피 한 잔 주세요.", "One coffee, please.", "coffee"],
    ["주문", "Order", "jumun", "주문해도 될까요?", "May I order?", "order"],
    ["자리", "Seat", "jari", "여기 자리 있어요?", "Is this seat taken?", "chair"],
    ["포장", "Takeout", "pojang", "포장해 주세요.", "To go, please.", "takeout"],
    ["계산", "Payment", "gyesan", "카드로 계산할게요.", "I will pay by card.", "pay"],
  ],
  classroom: [
    ["책", "Book", "chaek", "책을 펴 주세요.", "Please open your book.", "book"],
    ["책상", "Desk", "chaeksang", "책상 위에 책이 있어요.", "There is a book on the desk.", "desk"],
    ["의자", "Chair", "uija", "의자에 앉아요.", "I sit on a chair.", "chair"],
    ["수업", "Class", "sueop", "수업은 몇 시에 시작해요?", "What time does class start?", "classroom"],
    ["질문", "Question", "jilmun", "교수님, 질문 있습니다.", "Professor, I have a question.", "question"],
    ["과제", "Assignment", "gwaje", "과제를 제출해요.", "I submit my assignment.", "assignment"],
    ["발표", "Presentation", "balpyo", "내일 발표가 있어요.", "I have a presentation tomorrow.", "board"],
    ["출석", "Attendance", "chulseok", "출석을 확인해요.", "We check attendance.", "attendance"],
  ],
  mart: [
    ["사과", "Apple", "sagwa", "사과 두 개 주세요.", "Two apples, please.", "apple"],
    ["채소", "Vegetables", "chaeso", "신선한 채소를 사요.", "I buy fresh vegetables.", "vegetables"],
    ["우유", "Milk", "uyu", "우유는 어디에 있어요?", "Where is the milk?", "milk"],
    ["가격", "Price", "gagyeok", "이거 얼마예요?", "How much is this?", "price"],
    ["봉투", "Bag", "bongtu", "봉투 하나 주세요.", "One bag, please.", "bag"],
    ["영수증", "Receipt", "yeongsujeung", "영수증 주세요.", "A receipt, please.", "receipt"],
    ["할인", "Discount", "harin", "이 상품은 할인해요?", "Is this item on sale?", "discount"],
    ["계산대", "Checkout", "gyesandae", "계산대가 어디예요?", "Where is the checkout?", "checkout"],
  ],
  dormitory: [
    ["침대", "Bed", "chimdae", "침대에서 쉬어요.", "I rest in bed.", "bed"],
    ["방", "Room", "bang", "제 방은 삼 층에 있어요.", "My room is on the third floor.", "room"],
    ["세탁기", "Washing machine", "setakgi", "세탁기를 사용해도 돼요?", "May I use the washing machine?", "washer"],
    ["열쇠", "Key", "yeolsoe", "열쇠를 찾고 있어요.", "I am looking for my key.", "key"],
    ["청소", "Cleaning", "cheongso", "방을 청소해요.", "I clean my room.", "cleaning"],
    ["룸메이트", "Roommate", "rummeiteu", "룸메이트와 이야기해요.", "I talk with my roommate.", "roommate"],
    ["조용히", "Quietly", "joyonghi", "조용히 해 주세요.", "Please be quiet.", "quiet"],
    ["휴식", "Rest", "hyusik", "잠깐 휴식해요.", "I take a short rest.", "rest"],
  ],
  other: [
    ["여기", "Here", "yeogi", "여기에서 만나요.", "Let us meet here.", "place"],
    ["저기", "There", "jeogi", "저기에 있어요.", "It is over there.", "place"],
    ["어디", "Where", "eodi", "화장실이 어디예요?", "Where is the restroom?", "place"],
    ["입구", "Entrance", "ipgu", "입구에서 기다려요.", "I wait at the entrance.", "entrance"],
    ["출구", "Exit", "chulgu", "출구로 나가요.", "I leave through the exit.", "exit"],
    ["안내", "Information", "annae", "안내를 부탁해요.", "I would like some information.", "info"],
    ["도움", "Help", "doum", "도움이 필요해요.", "I need help.", "help"],
    ["감사", "Thanks", "gamsa", "감사합니다.", "Thank you.", "thanks"],
  ],
};
export const cultureSources = [{ id: "study-in-korea-guide", title: "국립국제교육원 · 한국 유학 가이드북, 필수 한국어", url: "https://cdn.studyinkorea.go.kr/public/res/guide/guideBook_ko.pdf", reviewedAt: "2026-11-02" }];
export function culture(type: SpaceType): CultureNote[] {
  return [
    {
      id: "help", titleKo: "도움이 필요할 때, 한마디", titleTranslated: "A little phrase goes a long way",
      descriptionKo: "한국어가 아직 익숙하지 않아도 괜찮아요. 도움이 필요할 때 이 표현으로 정중하게 부탁해 보세요.",
      descriptionTranslated: "It is okay if Korean still feels unfamiliar. Try this polite expression when you need help.",
      phraseKo: type === "classroom" ? "다시 한 번 말씀해 주시겠어요?" : "좀 도와주실 수 있나요?",
      phraseTranslated: type === "classroom" ? "Could you say that again, please?" : "Could you help me, please?",
      qualificationKo: "상대와 상황에 따라 더 자연스러운 표현은 달라질 수 있어요.",
      qualificationTranslated: "The most natural wording may vary with the person and situation.", sourceIds: ["study-in-korea-guide"],
    },
    {
      id: "thanks", titleKo: "작은 고마움도 말로 전해요", titleTranslated: "A small thank-you, a warm connection",
      descriptionKo: "도움을 받았다면 ‘감사합니다’라고 말해 보세요. 처음 만난 사람에게도 사용할 수 있는 정중한 감사 표현이에요.",
      descriptionTranslated: "Try saying ‘gamsahamnida’ after someone helps you. It is a polite way to thank someone, including a person you have just met.",
      phraseKo: "감사합니다.", phraseTranslated: "Thank you.",
      qualificationKo: "관계와 상황에 따라 다른 감사 표현을 쓸 수도 있어요.",
      qualificationTranslated: "Other expressions of thanks may suit different relationships and situations.", sourceIds: ["study-in-korea-guide"],
    },
  ];
}
export function makeBook(type: SpaceType, imageRef?: string, description = ""): VocabularyBook {
  const space = spaces.find(s => s.id === type)!;
  const isCafeSample = type === "restaurant" && !imageRef;
  let marker = 0;
  return {
    id: `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: type === "restaurant" ? "카페" : space.name,
    spaceType: type, spaceDescription: description, translationLanguage: "en",
    imageRef: imageRef || (type === "mart" ? "/images/mart.jpg" : type === "classroom" ? "/images/classroom.jpg" : "/images/cafe.jpg"),
    words: seeds[type].map(([korean, translation, roman, exampleKo, exampleTranslated, iconKey, bbox], i) => {
      const observed = isCafeSample && !!bbox;
      return { id: `w-${i}`, korean, translation, roman, exampleKo, exampleTranslated, iconKey, source: observed ? "observed" : "related", bbox: observed ? bbox! : null, markerNumber: observed ? ++marker : null };
    }),
    cultureNotes: culture(type), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sample: true,
  };
}
export const STORAGE_KEY = "teumteum:books:v1";

// Onboarding choices. `prompt` is what the model is told; the language list is what the server accepts.
export const languages = [
  { code: "en", name: "English", prompt: "English" }, { code: "zh", name: "中文", prompt: "Simplified Chinese" },
  { code: "ja", name: "日本語", prompt: "Japanese" }, { code: "vi", name: "Tiếng Việt", prompt: "Vietnamese" },
  { code: "mn", name: "Монгол", prompt: "Mongolian (Cyrillic)" }, { code: "uz", name: "Oʻzbek", prompt: "Uzbek (Latin)" },
  { code: "es", name: "Español", prompt: "Spanish" }, { code: "fr", name: "Français", prompt: "French" },
] as const;
export type Language = typeof languages[number]["code"];
export const levels = [
  { id: "beginner", prompt: "beginner (TOPIK 1–2): basic everyday nouns and verbs, very short 해요체 example sentences" },
  { id: "intermediate", prompt: "intermediate (TOPIK 3–4): more specific nouns, common verbs and set phrases, natural sentences with connectives" },
  { id: "advanced", prompt: "advanced (TOPIK 5–6): precise and Sino-Korean vocabulary, formal and colloquial nuance, richer example sentences" },
] as const;
export type Level = typeof levels[number]["id"];
export type Profile = { lang: Language; level: Level; plan: "free" | "pro" };
export const PROFILE_KEY = "teumteum:profile:v1";
// Free plan: AI-made books per Seoul day. ponytail: counted in this browser only; enforce on the server once there are accounts.
export const FREE_DAILY_BOOKS = 3;
export const USAGE_KEY = "teumteum:usage:v1";

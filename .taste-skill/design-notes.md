# 틈틈 — 현재 디자인

Installed skill: `/Users/yunsu/.codex/skills/design-taste-frontend`, from Leonxlnx/taste-skill (`skills/taste-skill`). App-screen direction: Editorial greeting, seed 221391076. Existing stack and Pretendard preserved. Explicit user requirements override the original direction: pure white, mobile only, minimum components, no marketing copy.

## Composition

Home: one book list, one add action, one example row. No hero, tagline, daily phrase or instructional sections.

Detail: thumbnail/title, actual current / total count, one half-screen photo card, previous/next arrows, culture notice, save. No word/culture tabs or separate study screen. The card toggles translation and bilingual examples. Culture opens a bottom sheet; the source photo and its numbered markers open from the thumbnail.

Colour belongs to photographs. All resting surfaces are white with no shadows. Only the dialog overlay has a shadow. App width is capped at 480px because this deliverable prioritizes mobile screens.

## Images

Coffee uses an image generated with the built-in image model. The per-word image URL and preparation status are modeled explicitly. Other words retain reference-image fallbacks. Runtime image generation is not connected. Prompt and output details: `public/images/generated/README.md`.

## Verification

- Final build, TypeScript and ESLint passed after the last copy and data changes.
- Static taste scan: 0 FAIL, 1 WARN (permitted real dialog shadow).
- CUA, actual 390 × 844 CSS viewport: body white; horizontal overflow false; card height 422.22px (50svh); save bottom 760.44px; bottom navigation top 772.45px. Card, notice and save all fit.
- Tap to reveal coffee translation and examples; left/right pointer swipes advance/reverse and reset the answer; photo marker 2 opens word 2; bottom culture notice opens bilingual notes with source links.
- Editing a temporary sample translation applied to the card; the unsaved test was discarded and a fresh sample restored. No broken images. Final screenshot: `preview/detail-minimal.png`.
- Direct CDP `inspect.mjs` is not used because browser interaction must go through CUA. No inspector score is claimed.

The prior version had excessive headings, a marketing hero and separate destinations. Those are removed under the user's latest instruction. Existing saved books and user-edited titles are preserved.

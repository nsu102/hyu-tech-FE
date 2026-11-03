import { iconKeys, type BBox, type IconKey, type Word } from "./data";

export function validBox(box: BBox | null | undefined): box is BBox {
  return !!box && box.length === 4 && box.every(Number.isFinite) && box.every(v => v >= 0 && v <= 1) && box[2] > 0 && box[3] > 0 && box[0] + box[2] <= 1 && box[1] + box[3] <= 1;
}
export function illustration(key: string | null | undefined) {
  return `/illustrations/${iconKeys.includes(key as IconKey) ? key : "mascot"}.svg`;
}
// Priority: explicit image (API/generated) → crop of the observed object in the space photo → illustration.
export function wordVisual(word: Word, scene: string) {
  if (word.imageRef && /^(?:https?:\/\/|\/(?!\/)|data:image\/(?:png|jpeg|webp);base64,)/.test(word.imageRef)) {
    return { kind: "generated" as const, src: word.imageRef, bbox: null, label: "단어 이미지" };
  }
  if (word.source === "observed" && validBox(word.bbox)) {
    return { kind: "crop" as const, src: scene, bbox: word.bbox, label: "공간 사진에서 찾은 사물" };
  }
  // ponytail: photoKey kept only for books saved before iconKey existed.
  return { kind: "illustration" as const, src: illustration(word.iconKey ?? word.photoKey), bbox: null, label: "일러스트" };
}

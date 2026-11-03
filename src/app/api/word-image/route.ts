import { InferenceClient } from "@huggingface/inference";

// 1) Local sticker server (scripts/sticker-server.py: SD1.5 + Stickers Redmond + LCM LoRA).
// 2) Fallback: HF Inference Providers with an Apache-2.0 sticker LoRA (needs HF_TOKEN with credits).
const LOCAL_URL = process.env.STICKER_SERVER_URL || "http://127.0.0.1:7860";
const HF_MODEL = process.env.HF_IMAGE_MODEL || "artificialguybr/STICKERS-REDMOND-ZIMAGETURBO";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { word?: unknown } | null;
  const word = typeof body?.word === "string" ? body.word.trim() : "";
  // The word goes into an image prompt, so keep it to a short plain phrase.
  if (!word || word.length > 60 || !/^[\p{L}\p{N} '’&-]+$/u.test(word)) return Response.json({ error: "invalid_word" }, { status: 400 });

  try {
    const res = await fetch(`${LOCAL_URL}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word }) });
    if (res.ok) return Response.json(await res.json());
    console.error("word-image local", res.status, await res.text());
  } catch { /* local server not running: try the hosted fallback */ }

  const token = process.env.HF_TOKEN;
  if (!token) return Response.json({ error: "no_image_backend" }, { status: 503 });
  try {
    const image = await new InferenceClient(token).textToImage({
      provider: "auto", model: HF_MODEL,
      inputs: `Sticker, a single cute kawaii sticker of ${word}, simple rounded shapes, soft pastel colors, thick clean outline, tiny happy face, centered, plain white background, no text`,
      parameters: { width: 512, height: 512 },
    }, { outputType: "dataUrl" });
    return Response.json({ image });
  } catch (error) {
    console.error("word-image", error);
    if (/no remaining credits|subscribe to PRO/i.test(String(error))) return Response.json({ error: "no_credits" }, { status: 402 });
    return Response.json({ error: "upstream_failed" }, { status: 502 });
  }
}

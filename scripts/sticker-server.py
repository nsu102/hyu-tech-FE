"""Local word -> cute picture server (Apple Silicon / CUDA / CPU).

SD1.5 (runwayml/stable-diffusion-v1-5) + one style LoRA + LCM LoRA (6-step sampling).
Run:   python3 scripts/sticker-server.py [--style cartoon]   -> http://127.0.0.1:7860
POST /generate {"word": "apple", "style"?: "clay"}  ->  {"image": "data:image/png;base64,..."}
Compare styles:  python3 scripts/sticker-server.py --test OUT_DIR   (writes OUT_DIR/styles.png)
"""
import base64, io, json, os, re, sys, time
from http.server import BaseHTTPRequestHandler, HTTPServer

import torch
from diffusers import LCMScheduler, StableDiffusionPipeline

DEVICE = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
STEPS, GUIDANCE, SIZE = 6, 1.5, 512  # LCM works best at 4-8 steps, guidance 1-2

# name: (repo, file, prompt template, LoRA weight). The weight is the style-strength knob.
STYLES = {
    "cartoon": ("artificialguybr/cutecartoon-redmond-1-5v-cute-cartoon-lora-for-liberteredmond-sd-1-5",
                "CuteCartoon15V-LiberteRedmodModel-Cartoon-CuteCartoonAF.safetensors",
                "CuteCartoonAF, a cute chubby {w} character with a happy face, simple shapes, pastel colors, white background", 0.9),
    "clay": ("artificialguybr/clayanimationredmond-1-5-version-clay-animation-lora-for-sd-1-5",
             "ClayAnimationRedmond15-ClayAnimation-Clay.safetensors",
             "Clay Animation, a cute tiny clay {w} with a smiling face, soft pastel colors, white background", 0.9),
    "icon": ("artificialguybr/icons-redmond-1-5v-app-icons-lora-for-sd-liberteredmond-sd-1-5",
             "IconsRedmond15V-Icons.safetensors",
             "icons, a cute kawaii {w} icon, rounded, pastel colors, simple, white background", 0.9),
    "sticker": ("artificialguybr/stickers-redmond-1-5-version-stickers-lora-for-sd-1-5",
                "StickersRedmond15Version-Stickers-Sticker.safetensors",
                "Stickers, a cute kawaii {w} sticker, pastel colors, thick outline, smiling face, white background", 0.8),
}
DEFAULT_STYLE = sys.argv[sys.argv.index("--style") + 1] if "--style" in sys.argv else os.environ.get("STICKER_STYLE", "cartoon")
NEGATIVE = "text, letters, watermark, realistic, photo, dark, scary, multiple objects, frame, border"

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16 if DEVICE != "cpu" else torch.float32, safety_checker=None,
)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5", adapter_name="lcm")
for name, (repo, file, _, _) in STYLES.items():
    pipe.load_lora_weights(repo, weight_name=file, adapter_name=name)
pipe.to(DEVICE)


def generate(word: str, style: str = DEFAULT_STYLE, seed: int | None = None) -> str:
    _, _, template, weight = STYLES[style]
    pipe.set_adapters(["lcm", style], adapter_weights=[1.0, weight])
    generator = torch.Generator("cpu").manual_seed(seed) if seed is not None else None
    image = pipe(template.format(w=word), negative_prompt=NEGATIVE, num_inference_steps=STEPS,
                 guidance_scale=GUIDANCE, width=SIZE, height=SIZE, generator=generator).images[0]
    buf = io.BytesIO()
    image.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


class Handler(BaseHTTPRequestHandler):
    # ponytail: single-threaded HTTPServer serialises generations, which the GPU needs anyway.
    def do_POST(self):
        if self.path != "/generate":
            return self.reply(404, {"error": "not_found"})
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
        except ValueError:
            return self.reply(400, {"error": "invalid_json"})
        word, style = str(body.get("word", "")).strip(), str(body.get("style") or DEFAULT_STYLE)
        if not word or len(word) > 60 or not re.fullmatch(r"[\w '’&-]+", word) or style not in STYLES:
            return self.reply(400, {"error": "invalid_input"})
        start = time.time()
        image = generate(word, style)
        print(f"{word!r} ({style}) in {time.time() - start:.1f}s", flush=True)
        self.reply(200, {"image": image})

    def reply(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    if "--test" in sys.argv:  # grid: one row per style, same words and seeds
        from PIL import Image
        out = sys.argv[sys.argv.index("--test") + 1]
        words = ["apple", "chair", "washing machine", "receipt"]
        grid = Image.new("RGB", (256 * len(words), 256 * len(STYLES)), "white")
        for row, style in enumerate(STYLES):
            for col, w in enumerate(words):
                start = time.time()
                img = Image.open(io.BytesIO(base64.b64decode(generate(w, style, seed=7).split(",", 1)[1])))
                grid.paste(img.resize((256, 256)), (col * 256, row * 256))
                print(f"{style:8} {w:16} {time.time() - start:.1f}s", flush=True)
        grid.save(os.path.join(out, "styles.png"))
        print("saved", os.path.join(out, "styles.png"), "rows:", ", ".join(STYLES), flush=True)
    else:
        print(f"sticker server on http://127.0.0.1:7860 ({DEVICE}, default style {DEFAULT_STYLE})", flush=True)
        HTTPServer(("127.0.0.1", 7860), Handler).serve_forever()

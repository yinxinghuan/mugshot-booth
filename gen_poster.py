#!/usr/bin/env python3
"""
Mugshot Booth poster generator.

Approach: take a high-resolution puppeteer screenshot of the live result
page (via /tmp/poster_raw.png produced by gen_poster_v2.cjs), then center
the portrait phone-frame on a 1080×1080 cream square with subtle
side-letterboxing decorated to feel like part of the same printed sheet.

Run:
  node /tmp/gen_poster_v2.cjs   # produces /tmp/poster_raw.png
  ~/miniconda3/bin/python3 gen_poster.py
"""
import os
import random
from PIL import Image, ImageDraw, ImageFilter

W = 1080
HERE = os.path.dirname(__file__)
PUBLIC = os.path.join(HERE, 'public')
OUTPUT_PATH = '/Users/yin/code/games/games/posters/mugshot-booth.png'
RAW_SCREENSHOT = '/tmp/poster_raw.png'

PAPER = (239, 228, 200)  # mb-paper
RED   = (230, 49, 29)
BLUE  = (29, 51, 196)


def main():
    if not os.path.exists(RAW_SCREENSHOT):
        raise SystemExit(f"missing {RAW_SCREENSHOT} — run gen_poster_v2.cjs first")

    raw = Image.open(RAW_SCREENSHOT).convert('RGBA')

    # Scale the raw screenshot to fit 1080 height while keeping aspect.
    rw, rh = raw.size
    scale = W / rh
    new_h = W
    new_w = int(rw * scale)
    raw_scaled = raw.resize((new_w, new_h), Image.LANCZOS)

    # Wait — the raw is portrait. Scaling to 1080 height makes it ~500
    # wide. Center it on a 1080×1080 cream canvas with decorative
    # letterboxing on the sides.
    canvas = Image.new('RGBA', (W, W), PAPER + (255,))

    # Letterbox decoration: subtle cream texture is already the bg.
    # Add a row of dashed brush marks on each side.
    d = ImageDraw.Draw(canvas)
    side_w = (W - new_w) // 2

    # Vertical "ALTERU PD · MUGSHOT BOOTH · ALT-2026-00042" stencil text
    # on the left side. Use textbbox to center the rotated text.
    try:
        from PIL import ImageFont
        font_paths = [
            '/System/Library/Fonts/Helvetica.ttc',
            '/System/Library/Fonts/Supplemental/Arial Black.ttf',
        ]
        font_path = next((p for p in font_paths if os.path.exists(p)),
                         '/System/Library/Fonts/Helvetica.ttc')
        f_label = ImageFont.truetype(font_path, 26)
        f_caption = ImageFont.truetype(font_path, 22)
    except Exception:
        f_label = None
        f_caption = None

    # Left-side rotated label
    label_text = "ALTERU PD  ·  MUGSHOT BOOTH  ·  CASE FILE 042"
    if f_label:
        # Render text on a small transparent image, then rotate 90° and paste
        text_img = Image.new('RGBA', (W - 80, 40), (0, 0, 0, 0))
        td = ImageDraw.Draw(text_img)
        td.text((0, 4), label_text, font=f_label, fill=BLUE + (220,))
        text_rot = text_img.rotate(90, resample=Image.BICUBIC, expand=True)
        canvas.alpha_composite(text_rot, (12, (W - text_rot.size[1]) // 2))
        # Mirror on the right
        text_rot_r = text_img.rotate(-90, resample=Image.BICUBIC, expand=True)
        canvas.alpha_composite(text_rot_r, (W - 12 - text_rot_r.size[0], (W - text_rot_r.size[1]) // 2))

    # Drop the screenshot onto the canvas
    canvas.alpha_composite(raw_scaled, (side_w, 0))

    # Add some scattered red ink residue dots on the letterbox area for
    # consistency with the in-game residue.
    random.seed(42)
    rd = ImageDraw.Draw(canvas)
    for _ in range(8):
        # left strip
        rx = random.randint(40, side_w - 30)
        ry = random.randint(40, W - 40)
        col = RED if random.random() < 0.6 else BLUE
        rd.ellipse((rx, ry, rx + 3, ry + 3), fill=col + (140,))
        # right strip
        rx2 = random.randint(side_w + new_w + 30, W - 40)
        ry2 = random.randint(40, W - 40)
        col2 = RED if random.random() < 0.6 else BLUE
        rd.ellipse((rx2, ry2, rx2 + 3, ry2 + 3), fill=col2 + (140,))

    # Bottom banner: "MUGSHOT BOOTH · ALTERU AFTER DARK"
    if f_caption:
        cap = "MUGSHOT BOOTH  ·  ALTERU AFTER DARK"
        bbox = rd.textbbox((0, 0), cap, font=f_caption)
        tw = bbox[2] - bbox[0]
        # leave room at very bottom
        rd.text(((W - tw) // 2, W - 36), cap, font=f_caption, fill=BLUE + (210,))

    out = canvas.convert('RGB')
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    out.save(OUTPUT_PATH, optimize=True)
    in_game = out.resize((1024, 1024), Image.LANCZOS)
    in_game.save(os.path.join(PUBLIC, 'poster.png'), optimize=True)
    print(f"saved {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH) // 1024} KB)")


if __name__ == '__main__':
    main()

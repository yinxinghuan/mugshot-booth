#!/usr/bin/env python3
"""
Compose the Mugshot Booth launch poster — 1080×1080 PNG.

Style: precinct case file. Manila folder field with a cream case sheet
center stage. Big stencil title, the demo mugshot photo prominent in a
photo frame, charges below, diagonal GUILTY stamp across the corner.
Evidence-tape accents + tape strips.

Run:
  ~/miniconda3/bin/python3 gen_poster.py
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

W, H = 1080, 1080
HERE = os.path.dirname(__file__)
PUBLIC = os.path.join(HERE, "public")
OUTPUT_PATH = "/Users/yin/code/games/games/posters/mugshot-booth.png"

MANILA       = (216, 205, 180)
MANILA_DARK  = (180, 165, 130)
PAPER        = (237, 226, 197)
PAPER_DARK   = (216, 201, 165)
INK          = (26, 22, 18)
INK_SOFT     = (58, 49, 40)
RED          = (160, 38, 23)
RED_DEEP     = (110, 22, 12)
CREAM        = (245, 236, 210)
SHADOW       = (0, 0, 0)


def pick(cands, default="/System/Library/Fonts/Helvetica.ttc"):
    return next((p for p in cands if os.path.exists(p)), default)


STENCIL_CANDS = [
    "/System/Library/Fonts/Supplemental/Impact.ttf",
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]
SERIF_CANDS = [
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
]
MONO_CANDS = [
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/Supplemental/Courier New Bold.ttf",
    "/System/Library/Fonts/Supplemental/Courier New.ttf",
]


def draw_grain(canvas, intensity=18, density=0.18):
    """Sprinkle B&W film grain noise across the canvas."""
    px = canvas.load()
    w, h = canvas.size
    for _ in range(int(w * h * density / 8)):
        x = random.randint(0, w - 1)
        y = random.randint(0, h - 1)
        r, g, b, a = px[x, y]
        d = random.randint(-intensity, intensity)
        px[x, y] = (max(0, min(255, r + d)),
                    max(0, min(255, g + d)),
                    max(0, min(255, b + d)), a)


def make_paper_texture(size):
    """Subtle ruled-paper background — horizontal lines + faint speckle."""
    w, h = size
    paper = Image.new("RGBA", size, PAPER + (255,))
    d = ImageDraw.Draw(paper)
    # Horizontal lines every 28px
    for y in range(0, h, 28):
        d.line((0, y, w, y), fill=(26, 22, 18, 20), width=1)
    # Random speckle marks
    for _ in range(int(w * h * 0.0006)):
        x = random.randint(0, w - 1)
        y = random.randint(0, h - 1)
        if random.random() < 0.6:
            d.point((x, y), fill=(26, 22, 18, random.randint(20, 60)))
    # Edge darkening
    for x in range(8):
        a = int(40 * (1 - x / 8))
        d.line((x, 0, x, h), fill=(0, 0, 0, a))
        d.line((w - 1 - x, 0, w - 1 - x, h), fill=(0, 0, 0, a))
        d.line((0, x, w, x), fill=(0, 0, 0, a))
        d.line((0, h - 1 - x, w, h - 1 - x), fill=(0, 0, 0, a))
    return paper


def draw_tape(canvas, x, y, w, h, angle=0, color=(220, 180, 120, 200)):
    """Strip of cellophane tape with subtle inner glow."""
    tape = Image.new("RGBA", (w, h), color)
    td = ImageDraw.Draw(tape)
    # Edge softening
    for i in range(3):
        a = 30 - i * 8
        td.line((0, i, w, i), fill=(255, 255, 255, a))
        td.line((0, h - 1 - i, w, h - 1 - i), fill=(255, 255, 255, a))
    # Subtle vertical streaks
    for sx in range(0, w, 4):
        td.line((sx, 0, sx, h), fill=(180, 140, 70, 12))
    if angle != 0:
        tape = tape.rotate(angle, resample=Image.BICUBIC, expand=True)
    # Drop shadow
    shadow = Image.new("RGBA", tape.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rectangle((4, 6, tape.size[0], tape.size[1]), fill=(0, 0, 0, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(4))
    canvas.alpha_composite(shadow, (x, y))
    canvas.alpha_composite(tape, (x, y))


def draw_stamp(canvas, x, y, text="GUILTY", sub="ALTERU PD", angle=-15, color=RED, scale=1.0):
    """Two-line red rubber stamp inside a double ring."""
    pad = 18
    main_font = ImageFont.truetype(pick(STENCIL_CANDS), int(76 * scale))
    sub_font  = ImageFont.truetype(pick(STENCIL_CANDS), int(22 * scale))
    tmp = Image.new("RGBA", (700, 280), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    tw = td.textlength(text, font=main_font)
    sw = td.textlength(sub, font=sub_font)
    inner_w = int(max(tw, sw) + pad * 2 + 60)
    inner_h = int(76 * scale + 22 * scale + pad * 2 + 18)
    stamp = Image.new("RGBA", (inner_w + 30, inner_h + 30), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stamp)
    # Double-ring rectangle
    border_color = color + (235,)
    sd.rectangle((6, 6, inner_w + 6, inner_h + 6), outline=border_color, width=8)
    sd.rectangle((18, 18, inner_w - 6, inner_h - 6), outline=border_color, width=3)
    # Main text
    text_x = (inner_w - tw) // 2 + 6
    text_y = 24
    sd.text((text_x, text_y), text, font=main_font, fill=color + (235,))
    # Sub text
    sub_x = (inner_w - sw) // 2 + 6
    sub_y = int(text_y + 76 * scale + 4)
    sd.text((sub_x, sub_y), sub, font=sub_font, fill=color + (220,))

    # Roughen by subtracting a grain mask from alpha
    grain = Image.new("L", stamp.size, 0)
    gp = grain.load()
    for gy in range(grain.size[1]):
        for gx in range(grain.size[0]):
            if random.random() < 0.06:
                gp[gx, gy] = random.randint(40, 110)
    grain = grain.filter(ImageFilter.GaussianBlur(0.6))
    from PIL import ImageChops
    alpha = stamp.split()[-1]
    alpha = ImageChops.subtract(alpha, grain)
    stamp.putalpha(alpha)

    rot = stamp.rotate(angle, resample=Image.BICUBIC, expand=True)
    rw, rh = rot.size
    canvas.alpha_composite(rot, (x - rw // 2, y - rh // 2))


def make_height_ruler(size):
    """Vertical height-ruler graphic — black ticks on white wall."""
    w, h = size
    img = Image.new("RGBA", size, (240, 235, 220, 255))
    d = ImageDraw.Draw(img)
    total_inches = 72  # 6 feet over the height
    for i in range(total_inches + 1):
        y = int(h - (i / total_inches) * h)
        if i % 12 == 0:
            tw = 40
            d.text((tw + 8, max(0, y - 18)),
                   f"{i // 12}'",
                   font=ImageFont.truetype(pick(STENCIL_CANDS), 26),
                   fill=(20, 18, 14))
        elif i % 6 == 0:
            tw = 26
        elif i % 3 == 0:
            tw = 18
        else:
            tw = 10
        d.line((0, y, tw, y), fill=(20, 18, 14, 255), width=2)
    # Faint stain
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for _ in range(40):
        cx = random.randint(0, w - 1)
        cy = random.randint(0, h - 1)
        r = random.randint(1, 6)
        od.ellipse((cx - r, cy - r, cx + r, cy + r),
                   fill=(40, 30, 20, random.randint(20, 80)))
    overlay = overlay.filter(ImageFilter.GaussianBlur(0.8))
    img.alpha_composite(overlay)
    return img


def make_mug_photo_panel(photo_path, size, frame_thickness=18):
    """Mounted mugshot photo with cream mat + drop shadow."""
    w, h = size
    panel = Image.new("RGBA", size, (10, 8, 8, 255))
    if os.path.exists(photo_path):
        photo = Image.open(photo_path).convert("RGB")
        photo = ImageOps.fit(photo, (w - 2 * frame_thickness, h - 2 * frame_thickness),
                             method=Image.LANCZOS)
        # Heavy B&W (autocontrast needs L/RGB, not RGBA)
        photo = ImageOps.grayscale(photo)
        photo = ImageOps.autocontrast(photo, cutoff=2)
        photo = photo.convert("RGBA")
        panel.paste(photo, (frame_thickness, frame_thickness))
    # Cream mat border
    md = ImageDraw.Draw(panel)
    md.rectangle((0, 0, w - 1, h - 1), outline=CREAM, width=4)
    return panel


def main():
    random.seed(42)
    canvas = Image.new("RGBA", (W, H), MANILA + (255,))

    # Background: subtle gradient + grain
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        a = int(35 * (y / H))
        gd.line((0, y, W, y), fill=(0, 0, 0, a))
    canvas.alpha_composite(grad)

    # Diagonal hatch pattern
    hatch = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hatch)
    for k in range(-H, W + H, 6):
        hd.line((k, 0, k + H, H), fill=(26, 22, 18, 10), width=1)
    canvas.alpha_composite(hatch)

    # Subtle radial vignette
    vig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    for r in range(0, max(W, H), 10):
        alpha = int(60 * (r / max(W, H)) ** 2)
        vd.ellipse((-r, -r, W + r, H + r), outline=(0, 0, 0, alpha), width=10)
    vig = vig.filter(ImageFilter.GaussianBlur(28))
    canvas.alpha_composite(vig)

    # ── Case sheet (cream paper) centered ──
    sheet_w, sheet_h = 880, 900
    sheet_x = (W - sheet_w) // 2
    sheet_y = (H - sheet_h) // 2 - 8

    # Shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rectangle((sheet_x + 18, sheet_y + 28, sheet_x + sheet_w + 18, sheet_y + sheet_h + 28),
                 fill=(0, 0, 0, 130))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    canvas.alpha_composite(shadow)

    paper = make_paper_texture((sheet_w, sheet_h))
    pd = ImageDraw.Draw(paper)
    pd.rectangle((0, 0, sheet_w - 1, sheet_h - 1), outline=INK + (255,), width=3)
    canvas.alpha_composite(paper, (sheet_x, sheet_y))

    d = ImageDraw.Draw(canvas)

    # ── Header — brand + case no ──
    head_font  = ImageFont.truetype(pick(STENCIL_CANDS), 56)
    sub_font   = ImageFont.truetype(pick(MONO_CANDS), 22)
    case_lbl   = ImageFont.truetype(pick(MONO_CANDS), 16)
    case_num   = ImageFont.truetype(pick(STENCIL_CANDS), 32)

    head_x = sheet_x + 40
    head_y = sheet_y + 40
    d.text((head_x, head_y), "ALTERU POLICE DEPT.", font=head_font, fill=INK)
    d.text((head_x, head_y + 64), "CONFIDENTIAL · CASE FILE", font=sub_font, fill=INK_SOFT)

    case_x_right = sheet_x + sheet_w - 40
    cl_w = d.textlength("CASE NO.", font=case_lbl)
    cn_text = "ALT-2026-00042"
    cn_w = d.textlength(cn_text, font=case_num)
    d.text((case_x_right - cl_w, head_y + 6), "CASE NO.", font=case_lbl, fill=INK_SOFT)
    d.text((case_x_right - cn_w, head_y + 30), cn_text, font=case_num, fill=INK)

    # Underline under header
    d.line((sheet_x + 40, head_y + 110, sheet_x + sheet_w - 40, head_y + 110),
           fill=INK + (255,), width=3)

    # ── Mug photo + ruler block ──
    body_y = head_y + 130
    photo_w, photo_h = 380, 480
    photo_x = sheet_x + 50
    panel = make_mug_photo_panel(os.path.join(PUBLIC, "demo_mugshot.jpg"),
                                 (photo_w, photo_h))
    # Photo block shadow
    p_shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ps = ImageDraw.Draw(p_shadow)
    ps.rectangle((photo_x + 8, body_y + 12, photo_x + photo_w + 8, body_y + photo_h + 12),
                 fill=(0, 0, 0, 110))
    p_shadow = p_shadow.filter(ImageFilter.GaussianBlur(12))
    canvas.alpha_composite(p_shadow)
    canvas.alpha_composite(panel, (photo_x, body_y))

    caption_font = ImageFont.truetype(pick(MONO_CANDS), 14)
    d.text((photo_x, body_y + photo_h + 8), "FRONT VIEW — INTAKE",
           font=caption_font, fill=INK_SOFT)

    # ── Right column: info rows ──
    info_x = photo_x + photo_w + 36
    info_w = sheet_w - 50 - photo_w - 36 - 40
    info_y = body_y + 6

    rows = [
        ("BOOKING DATE", "2026-05-23"),
        ("HEIGHT", '5\'09" (when asked)'),
        ("EYES", "wifi-bar grey"),
        ("PRECINCT", "PRECINCT 17: SLOW SIDE"),
    ]
    row_lbl_font = ImageFont.truetype(pick(MONO_CANDS), 13)
    row_val_font = ImageFont.truetype(pick(STENCIL_CANDS), 22)
    for i, (lbl, val) in enumerate(rows):
        ry = info_y + i * 40
        d.text((info_x, ry), lbl, font=row_lbl_font, fill=INK_SOFT)
        d.text((info_x, ry + 16), val, font=row_val_font, fill=INK)
        d.line((info_x, ry + 38, info_x + info_w, ry + 38), fill=INK + (160,), width=1)

    # Distinguishing marks
    marks_y = info_y + 4 * 40 + 8
    d.text((info_x, marks_y), "DISTINGUISHING MARKS",
           font=row_lbl_font, fill=INK_SOFT)
    marks_text = ("Faint scar above left eyebrow;\n"
                  "carries the posture of someone\n"
                  "who reads their own horoscope.")
    marks_font = ImageFont.truetype(pick(MONO_CANDS), 16)
    d.multiline_text((info_x, marks_y + 22), marks_text,
                     font=marks_font, fill=INK, spacing=4)

    # Plea
    plea_y = marks_y + 22 + 88
    d.text((info_x, plea_y), "SUSPECT'S STATEMENT",
           font=row_lbl_font, fill=INK_SOFT)
    plea_font = ImageFont.truetype(pick(SERIF_CANDS), 17)
    d.text((info_x, plea_y + 22),
           '"It wasn\'t me. It was vibes."',
           font=plea_font, fill=INK)

    # ── Charges block ──
    ch_y = body_y + photo_h + 56
    ch_pad = 18
    ch_x = sheet_x + 40
    ch_w = sheet_w - 80
    ch_h = 168
    # Block bg
    ch_bg = Image.new("RGBA", (ch_w, ch_h), PAPER_DARK + (255,))
    cbd = ImageDraw.Draw(ch_bg)
    cbd.rectangle((0, 0, ch_w - 1, ch_h - 1), outline=INK + (255,), width=4)
    canvas.alpha_composite(ch_bg, (ch_x, ch_y))

    ch_lbl_font = ImageFont.truetype(pick(MONO_CANDS), 13)
    ch_head_font = ImageFont.truetype(pick(STENCIL_CANDS), 44)
    ch_sup_font = ImageFont.truetype(pick(MONO_CANDS), 17)
    d.text((ch_x + ch_pad, ch_y + 10), "CHARGES",
           font=ch_lbl_font, fill=INK_SOFT)
    headline = "LOITERING WITH INTENT TO VIBE"
    d.text((ch_x + ch_pad, ch_y + 30), headline,
           font=ch_head_font, fill=INK)
    supporting = [
        "1. Possession of unsent texts after midnight",
        "2. Failure to maintain eye contact during obligation",
        "3. Disorderly hope in the first degree",
    ]
    for i, line in enumerate(supporting):
        d.text((ch_x + ch_pad, ch_y + 90 + i * 24), line,
               font=ch_sup_font, fill=INK)

    # ── Footer ──
    f_y = sheet_y + sheet_h - 36
    f_font = ImageFont.truetype(pick(MONO_CANDS), 12)
    d.line((sheet_x + 40, f_y - 6, sheet_x + sheet_w - 40, f_y - 6),
           fill=INK + (160,), width=1)
    d.text((sheet_x + 40, f_y), "BOOKING OFFICER: ALG-04",
           font=f_font, fill=INK_SOFT)
    d.text((sheet_x + 40 + 280, f_y), "FILED: 2026-05-23",
           font=f_font, fill=INK_SOFT)
    foot_right = "ALTERU.STUDIO/MUGSHOT-BOOTH"
    fr_w = d.textlength(foot_right, font=f_font)
    d.text((sheet_x + sheet_w - 40 - fr_w, f_y), foot_right,
           font=f_font, fill=INK_SOFT)

    # ── GUILTY stamp (after content so it stamps over) ──
    draw_stamp(canvas, x=sheet_x + sheet_w - 130, y=sheet_y + 540,
               text="GUILTY", sub="ALTERU PD",
               angle=-15, color=RED, scale=1.6)

    # ── Tape strips on the sheet edges ──
    draw_tape(canvas, x=sheet_x + 60, y=sheet_y - 16,
              w=180, h=36, angle=-4)
    draw_tape(canvas, x=sheet_x + sheet_w - 240, y=sheet_y - 12,
              w=180, h=36, angle=3)
    draw_tape(canvas, x=sheet_x - 30, y=sheet_y + sheet_h - 50,
              w=160, h=30, angle=7)
    draw_tape(canvas, x=sheet_x + sheet_w - 130, y=sheet_y + sheet_h - 48,
              w=160, h=30, angle=-6)

    # ── Diagonal "EVIDENCE" tape at the very top ──
    et_w, et_h = 1400, 64
    evidence = Image.new("RGBA", (et_w, et_h), (240, 196, 70, 245))
    ed = ImageDraw.Draw(evidence)
    ed.rectangle((0, 0, et_w - 1, et_h - 1), outline=(120, 90, 30, 200), width=2)
    ev_font = ImageFont.truetype(pick(STENCIL_CANDS), 38)
    txt = "EVIDENCE · ALTERU PD · DO NOT REMOVE · EVIDENCE · ALTERU PD · DO NOT REMOVE"
    tx = 0
    while tx < et_w + 200:
        ed.text((tx, 12), txt, font=ev_font, fill=(40, 30, 12, 235))
        tx += int(ed.textlength(txt + "    ", font=ev_font))
    ev_rot = evidence.rotate(-22, resample=Image.BICUBIC, expand=True)
    canvas.alpha_composite(ev_rot, (-150, -80))

    # ── Headline title at the bottom — "MUGSHOT BOOTH" ──
    title_band = Image.new("RGBA", (W, 132), (26, 22, 18, 255))
    tbd = ImageDraw.Draw(title_band)
    title_font = ImageFont.truetype(pick(STENCIL_CANDS), 80)
    title_text = "MUGSHOT BOOTH"
    ttw = tbd.textlength(title_text, font=title_font)
    tbd.text(((W - ttw) // 2, 18), title_text, font=title_font, fill=CREAM)
    subtitle_font = ImageFont.truetype(pick(MONO_CANDS), 18)
    subtitle = "UPLOAD A SELFIE.  GET BOOKED.  ALTERU AFTER DARK."
    stw = tbd.textlength(subtitle, font=subtitle_font)
    tbd.text(((W - stw) // 2, 96), subtitle,
             font=subtitle_font, fill=(245, 236, 210, 220))
    # Red top edge
    tbd.rectangle((0, 0, W, 4), fill=RED + (255,))
    canvas.alpha_composite(title_band, (0, H - 132))

    # Subtle film grain across the whole poster
    grain_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_grain(grain_overlay, intensity=22, density=0.28)
    canvas.alpha_composite(grain_overlay)

    out = canvas.convert("RGB")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    out.save(OUTPUT_PATH, optimize=True)
    in_game = out.resize((1024, 1024), Image.LANCZOS)
    in_game.save(os.path.join(PUBLIC, "poster.png"), optimize=True)
    print(f"saved {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH) // 1024} KB)")
    print(f"saved {os.path.join(PUBLIC, 'poster.png')}")


if __name__ == "__main__":
    main()

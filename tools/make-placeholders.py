# -*- coding: utf-8 -*-
"""
Генератор временных изображений для первой версии портфолио.

Вместо «ненастоящих фото» рисует аккуратные дизайнерские заглушки: тон
палитры, крупный номер кадра, подпись и соотношение сторон. Так видно, что
это временные файлы, и при этом можно оценить сетку, пропорции и типографику.

Запуск:
    python tools/make-placeholders.py

Когда появятся настоящие снимки, скрипт можно удалить: сайт работает с любыми
.jpg/.jpeg/.png/.webp, положенными в assets/img.
"""

from __future__ import annotations

import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "img"
IMG_DIR.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path(r"C:\Windows\Fonts")
FONT_SERIF = FONT_DIR / "georgia.ttf"
FONT_SANS = FONT_DIR / "segoeui.ttf"
FONT_SANS_LIGHT = FONT_DIR / "segoeuil.ttf"

# палитра: (верх градиента, низ, акцент)
PALETTES = {
    "blue": ((14, 20, 30), (27, 39, 55), (96, 136, 190)),
    "warm": ((22, 18, 15), (57, 41, 29), (206, 154, 102)),
    "mono": ((18, 18, 19), (38, 38, 41), (150, 148, 144)),
    "green": ((14, 21, 18), (28, 42, 34), (110, 150, 124)),
    "rose": ((23, 16, 19), (48, 30, 35), (186, 126, 124)),
    "sand": ((22, 19, 15), (50, 42, 32), (198, 170, 126)),
}


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(str(path), size)
    except OSError:
        return ImageFont.load_default(size)


def gradient(w: int, h: int, top, bottom) -> Image.Image:
    t = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, None, None] ** 1.15
    a = np.array(top, dtype=np.float32)[None, None, :]
    b = np.array(bottom, dtype=np.float32)[None, None, :]
    arr = np.repeat(a + (b - a) * t, w, axis=1)
    return Image.fromarray(arr.astype(np.uint8), "RGB")


def add_light(img: Image.Image, accent, seed: int) -> Image.Image:
    """Мягкое световое пятно, чтобы плоскость не была мёртвой."""
    rng = random.Random(seed)
    w, h = img.size
    layer = Image.new("RGB", (w, h), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = rng.uniform(0.2, 0.8) * w, rng.uniform(0.15, 0.7) * h
    r = max(w, h) * rng.uniform(0.45, 0.75)
    for i in range(8, 0, -1):
        k = i / 8
        rr = r * k
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=tuple(int(v * 0.16 * (1 - k) ** 1.4) for v in accent))
    layer = layer.filter(ImageFilter.GaussianBlur(max(w, h) * 0.05))
    return Image.fromarray(
        np.clip(np.asarray(img, np.int16) + np.asarray(layer, np.int16), 0, 255).astype(np.uint8), "RGB"
    )


def grain(img: Image.Image, seed: int, amount: float = 4.0) -> Image.Image:
    np.random.seed(seed)
    arr = np.asarray(img, dtype=np.float32)
    arr += np.repeat(np.random.normal(0, amount, (img.height, img.width, 1)), 3, axis=2)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def tracked_text(d: ImageDraw.ImageDraw, xy, text: str, fnt, fill, tracking: float) -> None:
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill)
        x += d.textlength(ch, font=fnt) + tracking


def make(
    name: str,
    size: tuple[int, int],
    palette: str,
    *,
    index: str | None,
    kind: str,
    seed: int,
    frame: bool = True,
) -> None:
    w, h = size
    top, bottom, accent = PALETTES[palette]

    img = gradient(w, h, top, bottom)
    img = add_light(img, accent, seed)
    img = grain(img, seed)

    if frame:
        d = ImageDraw.Draw(img, "RGBA")
        inset = int(min(w, h) * 0.035)
        d.rectangle([inset, inset, w - inset, h - inset], outline=(255, 255, 255, 26), width=max(1, int(min(w, h) * 0.0012)))

    if index:
        # крупный номер кадра
        d = ImageDraw.Draw(img, "RGBA")
        f = font(FONT_SERIF, int(min(w, h) * 0.2))
        tw = d.textlength(index, font=f)
        d.text(((w - tw) / 2, h / 2 - min(w, h) * 0.15), index, font=f, fill=(255, 255, 255, 30))

        cap_size = max(11, int(w * 0.0155))
        f_cap = font(FONT_SANS_LIGHT, cap_size)
        pad = int(w * 0.045)
        tracked_text(d, (pad, h - pad - cap_size * 1.6), "PLACEHOLDER", f_cap, (255, 255, 255, 105), cap_size * 0.28)
        tracked_text(d, (pad, h - pad - cap_size * 0.4), kind, f_cap, (255, 255, 255, 58), cap_size * 0.28)

        ratio = f"{size[0]}:{size[1]}"
        rw = d.textlength(ratio, font=f_cap) + cap_size * 0.28 * len(ratio)
        d.text((w - pad - rw, h - pad - cap_size * 0.4), ratio, font=f_cap, fill=(255, 255, 255, 58))

    out = IMG_DIR / name
    img.save(out, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"{name:16s} {w}x{h}  {out.stat().st_size // 1024} KB")


PHOTOS = [
    ("photo-01.jpg", (1200, 1600), "rose", "01", "фото · портрет"),
    ("photo-02.jpg", (1600, 1067), "blue", "02", "фото · город"),
    ("photo-03.jpg", (1200, 1200), "mono", "03", "фото · студия"),
    ("photo-04.jpg", (1200, 1600), "warm", "04", "фото · свадьба"),
    ("photo-05.jpg", (1600, 1067), "sand", "05", "фото · путешествие"),
    ("photo-06.jpg", (1200, 1500), "green", "06", "фото · природа"),
    ("photo-07.jpg", (1200, 1200), "blue", "07", "фото · репортаж"),
    ("photo-08.jpg", (1600, 1067), "mono", "08", "фото · портрет"),
    ("photo-09.jpg", (1200, 1600), "blue", "09", "фото · город"),
    ("photo-10.jpg", (1600, 1067), "rose", "10", "фото · свадьба"),
    ("photo-11.jpg", (1200, 1500), "sand", "11", "фото · путешествие"),
    ("photo-12.jpg", (1200, 1200), "green", "12", "фото · коммерция"),
    ("photo-13.jpg", (1200, 1600), "warm", "13", "фото · свадьба"),
    ("photo-14.jpg", (1600, 1067), "blue", "14", "фото · репортаж"),
]

VIDEOS = [
    ("video-01.jpg", (1600, 900), "warm", "V1", "видео · свадебный фильм"),
    ("video-02.jpg", (1600, 900), "blue", "V2", "видео · город"),
    ("video-03.jpg", (1600, 900), "green", "V3", "видео · природа"),
    ("video-04.jpg", (1600, 900), "mono", "V4", "видео · бэкстейдж"),
]

for f, s, p, i, k in PHOTOS:
    make(f, s, p, index=i, kind=k, seed=sum(map(ord, f)))

for f, s, p, i, k in VIDEOS:
    make(f, s, p, index=i, kind=k, seed=sum(map(ord, f)))

make("hero-1.jpg", (1920, 1080), "warm", index=None, kind="", seed=41, frame=False)
make("hero-2.jpg", (1920, 1080), "blue", index=None, kind="", seed=42, frame=False)
make("hero-3.jpg", (1920, 1080), "rose", index=None, kind="", seed=43, frame=False)
make("about.jpg", (1000, 1300), "mono", index="Я", kind="фото · портрет", seed=51)
make("og.jpg", (1200, 630), "warm", index=None, kind="", seed=61, frame=False)

print("Готово:", IMG_DIR)

# -*- coding: utf-8 -*-
"""Собирает контактный лист из всех картинок assets/img для быстрой проверки."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
files = sorted(p for p in IMG.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})

CELL_W, CELL_H, PAD = 280, 200, 10
cols = 5
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (CELL_W + PAD) + PAD, rows * (CELL_H + PAD) + PAD), (18, 18, 18))
d = ImageDraw.Draw(sheet)

for i, f in enumerate(files):
    im = Image.open(f).convert("RGB")
    im.thumbnail((CELL_W, CELL_H))
    x = PAD + (i % cols) * (CELL_W + PAD) + (CELL_W - im.width) // 2
    y = PAD + (i // cols) * (CELL_H + PAD) + (CELL_H - im.height) // 2
    sheet.paste(im, (x, y))
    d.text((PAD + (i % cols) * (CELL_W + PAD) + 4, PAD + (i // cols) * (CELL_H + PAD) + 4), f.name, fill=(255, 255, 255))

out = ROOT / "tools" / "_contact-sheet.jpg"
sheet.save(out, quality=85)
print(out)

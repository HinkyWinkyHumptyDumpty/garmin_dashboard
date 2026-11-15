"""App-Icons für Dreiklang erzeugen (Version 10): weiße Fläche, Ring in Sky Blue, Punkt in Hot Pink – flach, ohne Verlauf.
usage: python3 scripts/make-icons.py public/icons
Erzeugt icon-192.png, icon-512.png (abgerundet), icon-maskable-512.png und apple-touch-icon.png (vollflächig) sowie favicon.svg.
"""
import math
import os
import sys

from PIL import Image, ImageDraw

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
WEISS, SKY, PINK = (252, 255, 255), (5, 147, 198), (216, 57, 149)
# Maße wie im SVG (viewBox 24): Ring r = 7, Strich 2,8, Bogen 270° ab 135°, Punkt r = 2,1, Ecken 5,3
RING_R, STRICH, DOT_R, ECKE = 7 / 24, 2.8 / 24, 2.1 / 24, 5.3 / 24


def icon(size, rund):
    S = size * 4  # Supersampling für glatte Kanten
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rund:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * ECKE), fill=WEISS + (255,))
    else:
        d.rectangle([0, 0, S - 1, S - 1], fill=WEISS + (255,))
    c, r, w = S / 2, S * RING_R, S * STRICH
    # PIL zeichnet die Linienbreite nach innen: Außenradius = r + w/2
    ro = r + w / 2
    d.arc([c - ro, c - ro, c + ro, c + ro], 135, 405, fill=SKY + (255,), width=int(round(w)))
    for ang in (135, 405):  # runde Enden
        px, py = c + r * math.cos(math.radians(ang)), c + r * math.sin(math.radians(ang))
        d.ellipse([px - w / 2, py - w / 2, px + w / 2, py + w / 2], fill=SKY + (255,))
    dr = S * DOT_R
    d.ellipse([c - dr, c - dr, c + dr, c + dr], fill=PINK + (255,))
    out = img.resize((size, size), Image.LANCZOS)
    return out if rund else out.convert("RGB")


for name, size, rund in (("icon-192.png", 192, True), ("icon-512.png", 512, True), ("icon-maskable-512.png", 512, False), ("apple-touch-icon.png", 180, False)):
    icon(size, rund).save(os.path.join(OUT, name))
with open(os.path.join(OUT, "favicon.svg"), "w") as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5.3" fill="#fcffff"/>'
            '<circle cx="12" cy="12" r="7" fill="none" stroke="#0593c6" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="33 44" transform="rotate(135 12 12)"/>'
            '<circle cx="12" cy="12" r="2.1" fill="#d83995"/></svg>')
print("Icons in", OUT)

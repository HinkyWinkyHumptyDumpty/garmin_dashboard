"""App-Icons für Tagesform erzeugen (Ring-Logo, Verlauf grün → blau).
usage: python3 scripts/make-icons.py public/icons
"""
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
G0, G1 = (48, 209, 88), (10, 132, 255)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_icon(size, pad_frac, rounded):
    S = size * 4  # Supersampling
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(bg)
    # dunkler Hintergrund mit leichtem Verlauf
    for y in range(S):
        c = lerp((28, 28, 32), (8, 8, 10), y / S)
        d.line([(0, y), (S, y)], fill=c + (255,))
    if rounded:
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.225), fill=255)
        img.paste(bg, (0, 0), mask)
    else:
        img = bg
    # Ring: 270° Bogen, Start unten links
    cx = cy = S / 2
    r = S * (0.5 - pad_frac) * 0.78
    w = S * 0.105 * (1 - pad_frac * 1.2)
    ring = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    start, sweep, n = 135, 270, 540
    for i in range(n):
        a0 = start + sweep * i / n
        a1 = start + sweep * (i + 1.6) / n
        col = lerp(G0, G1, i / (n - 1))
        rd.arc([cx - r, cy - r, cx + r, cy + r], a0, min(a1, start + sweep), fill=col + (255,), width=int(w))
    # runde Enden (PIL zeichnet die Linienbreite nach innen: Mittellinie bei r - w/2)
    rm, rr = r - w / 2, w / 2
    for ang, col in ((start, G0), (start + sweep, G1)):
        px, py = cx + rm * math.cos(math.radians(ang)), cy + rm * math.sin(math.radians(ang))
        rd.ellipse([px - rr, py - rr, px + rr, py + rr], fill=col + (255,))
    # sanftes Leuchten
    glow = ring.filter(ImageFilter.GaussianBlur(S * 0.03))
    glow.putalpha(glow.getchannel("A").point(lambda v: int(v * 0.5)))
    img.alpha_composite(glow)
    img.alpha_composite(ring)
    # Mittelpunkt
    dot = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dot)
    rr = S * 0.075 * (1 - pad_frac)
    for k in range(int(rr * 2) + 3):
        col = lerp(G0, G1, k / max(1, rr * 2 - 1))
        dd.line([(cx - rr + k, cy - rr), (cx - rr + k, cy + rr)], fill=col + (255,))
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=255)
    img.paste(dot, (0, 0), m)
    return img.resize((size, size), Image.LANCZOS)


draw_icon(512, 0.06, False).save(os.path.join(OUT, "icon-512.png"))
draw_icon(192, 0.06, False).save(os.path.join(OUT, "icon-192.png"))
draw_icon(512, 0.16, False).save(os.path.join(OUT, "icon-maskable-512.png"))
draw_icon(180, 0.06, False).convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))

svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#30d158"/><stop offset="1" stop-color="#0a84ff"/></linearGradient></defs><rect width="24" height="24" rx="5.4" fill="#141416"/><circle cx="12" cy="12" r="7" fill="none" stroke="url(#g)" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="33 44" transform="rotate(135 12 12)"/><circle cx="12" cy="12" r="2.1" fill="url(#g)"/></svg>
'''
open(os.path.join(OUT, "favicon.svg"), "w").write(svg)
print("ok")

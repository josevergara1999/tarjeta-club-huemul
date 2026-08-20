# ============================================================================
# EL QR DEL MESÓN
# ============================================================================
# Genera dos archivos:
#
#   qr-club-huemul.png     el código solo, para meterlo en cualquier diseño
#   mesa-club-huemul.png   la tarjeta de mesa lista para imprimir (A6, 300 ppp)
#
# Corrección de errores ALTA: el código sigue leyéndose con una mancha de
# aceite, un reflejo o una esquina doblada, que es lo que le va a pasar encima
# de una mesa de restaurante.
#
#   python -m pip install segno pillow
#   python generar-qr.py
#
# La tipografía Jost se baja de Google Fonts (misma del diseño). Si no está,
# el guion sigue con la del sistema y lo avisa.
# ============================================================================

import io
import os
import sys

import segno
from PIL import Image, ImageDraw, ImageFont

URL = "https://josevergara1999.github.io/tarjeta-club-huemul/"

GRANATE = (107, 56, 63)
CREMA   = (233, 226, 214)
CREMA_2 = (217, 209, 197)
TINTA   = (56, 36, 43)
SUAVE   = (138, 117, 102)

AQUI = os.path.dirname(os.path.abspath(__file__))
FUENTE = os.environ.get("JOST", os.path.join(AQUI, "Jost.ttf"))


def jost(tam, peso="Regular"):
    """Jost en el peso pedido; si no está el archivo, la del sistema."""
    try:
        f = ImageFont.truetype(FUENTE, tam)
        try:
            f.set_variation_by_name(peso)
        except Exception:
            pass
        return f
    except OSError:
        return ImageFont.load_default(tam)


def espaciado(dib, xy, texto, fuente, color, espacio, centrar_en=None):
    """Dibuja texto con letter-spacing. Pillow no lo trae, y sin él la
    tipografía del Club pierde justo lo que la hace suya."""
    letras = list(texto)
    anchos = [dib.textlength(c, font=fuente) for c in letras]
    total = sum(anchos) + espacio * (len(letras) - 1)
    x, y = xy
    if centrar_en is not None:
        x = (centrar_en - total) / 2
    for c, a in zip(letras, anchos):
        dib.text((x, y), c, font=fuente, fill=color)
        x += a + espacio
    return total


def qr_imagen(escala, borde=2):
    qr = segno.make(URL, error="h")
    buf = io.BytesIO()
    qr.save(buf, kind="png", scale=escala, border=borde,
            dark="#%02x%02x%02x" % GRANATE, light="#%02x%02x%02x" % CREMA)
    buf.seek(0)
    return Image.open(buf).convert("RGB")


def logo(lado):
    """El cuadro granate con HUE MUL, recortado del logo real."""
    ruta = os.path.join(AQUI, "..", "docs", "icono-512.png")
    if os.path.exists(ruta):
        return Image.open(ruta).convert("RGB").resize((lado, lado), Image.LANCZOS)
    im = Image.new("RGB", (lado, lado), GRANATE)
    d = ImageDraw.Draw(im)
    f = jost(int(lado * 0.26), "Medium")
    espaciado(d, (0, lado * 0.20), "HUE", f, CREMA, lado * 0.05, centrar_en=lado)
    espaciado(d, (0, lado * 0.52), "MUL", f, CREMA, lado * 0.05, centrar_en=lado)
    return im


# ── 1. El código solo ───────────────────────────────────────────────────────

solo = qr_imagen(escala=40, borde=4)
solo.save(os.path.join(AQUI, "qr-club-huemul.png"))
print("qr-club-huemul.png  %dx%d" % solo.size)


# ── 2. La tarjeta de mesa (A6 a 300 ppp) ────────────────────────────────────

W, H = 1240, 1748
carta = Image.new("RGB", (W, H), CREMA)
d = ImageDraw.Draw(carta)

# Un filete por dentro, no un marco: enmarcar el QR le quita aire y lo hace
# parecer un cupón de descuento.
d.rectangle([54, 54, W - 55, H - 55], outline=CREMA_2, width=3)

L = 168
carta.paste(logo(L), ((W - L) // 2, 150))

espaciado(d, (0, 384), "CLUB HUEMUL", jost(52, "Light"), TINTA, 17, centrar_en=W)
espaciado(d, (0, 460), "PROGRAMA DE FIDELIZACIÓN", jost(25, "Regular"), SUAVE, 9, centrar_en=W)

# El QR, con el aire que necesita para leerse rápido de pie.
q = qr_imagen(escala=22, borde=2)
lado = 620
q = q.resize((lado, lado), Image.NEAREST)
carta.paste(q, ((W - lado) // 2, 604))

espaciado(d, (0, 1320), "ESCANEA CON LA CÁMARA", jost(34, "Medium"), TINTA, 11, centrar_en=W)

f = jost(29, "Light")
for i, linea in enumerate([
    "Tu tarjeta del restaurante, en tu teléfono.",
    "Junta visitas, gana premios y entérate",
    "primero de lo que viene.",
]):
    ancho = d.textlength(linea, font=f)
    d.text(((W - ancho) / 2, 1392 + i * 46), linea, font=f, fill=SUAVE)

carta.save(os.path.join(AQUI, "mesa-club-huemul.png"))
print("mesa-club-huemul.png  %dx%d" % carta.size)
print("apunta a:", URL)

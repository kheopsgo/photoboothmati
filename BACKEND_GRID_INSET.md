# Montage 4 photos masqué par le cadre — patch backend

## Symptôme

Sur le rendu 4 photos, les deux photos du bas sont recouvertes par le bandeau
texte du cadre (titre / date / message).

## Cause

`/create-grid` compose la grille 2x2 sur **toute** la surface 1200x1800, puis
applique le PNG du cadre par-dessus. Or le cadre n'est transparent que sur sa
zone photo (environ le haut 70 % de l'image) : tout ce qui dépasse est masqué.

## Correctif

Le frontend envoie désormais, avec le PNG du cadre (`POST /frame-upload`), la
géométrie normalisée de la zone transparente :

```json
{ "image": "data:image/png;base64,...", "hole": { "x": 0.05, "y": 0.055, "w": 0.9, "h": 0.68 } }
```

### 1. Mémoriser la zone photo

```python
import json, os

FRAME_DIR = os.path.expanduser("~/photobooth-backend/static")
FRAME_HOLE_PATH = os.path.join(FRAME_DIR, "frame_hole.json")
DEFAULT_HOLE = {"x": 0.05, "y": 0.055, "w": 0.90, "h": 0.68}

def load_hole():
    try:
        with open(FRAME_HOLE_PATH) as f:
            h = json.load(f)
        if all(k in h for k in ("x", "y", "w", "h")):
            return h
    except Exception:
        pass
    return DEFAULT_HOLE
```

Dans la route `/frame-upload`, après avoir sauvegardé le PNG :

```python
    hole = (request.json or {}).get("hole")
    if hole:
        with open(FRAME_HOLE_PATH, "w") as f:
            json.dump(hole, f)
```

### 2. Composer la grille DANS la zone photo

```python
from PIL import Image

FINAL_SIZE = (1200, 1800)
GAP = 16

def build_grid(photo_paths):
    W, H = FINAL_SIZE
    hole = load_hole()
    ax, ay = int(hole["x"] * W), int(hole["y"] * H)
    aw, ah = int(hole["w"] * W), int(hole["h"] * H)

    tw = (aw - GAP) // 2
    th = (ah - GAP) // 2

    canvas = Image.new("RGB", (W, H), "white")
    positions = [(ax, ay), (ax + tw + GAP, ay), (ax, ay + th + GAP), (ax + tw + GAP, ay + th + GAP)]

    for path, (x, y) in zip(photo_paths[:4], positions):
        img = Image.open(path).convert("RGB")
        # crop "cover" centré
        sr, dr = img.width / img.height, tw / th
        if sr > dr:
            nw = int(img.height * dr)
            img = img.crop(((img.width - nw) // 2, 0, (img.width + nw) // 2, img.height))
        else:
            nh = int(img.width / dr)
            img = img.crop((0, (img.height - nh) // 2, img.width, (img.height + nh) // 2))
        canvas.paste(img.resize((tw, th), Image.LANCZOS), (x, y))

    return canvas
```

Puis appliquer le cadre :

```python
    frame = Image.open(FRAME_PNG).convert("RGBA").resize(FINAL_SIZE, Image.LANCZOS)
    out = canvas.convert("RGBA")
    out.alpha_composite(frame)
    out.convert("RGB").save(final_path, "JPEG", quality=92, optimize=True)
```

### 3. Redéployer

```bash
sudo systemctl restart photobooth
```

Puis, sur la tablette : Paramètres → **Enregistrer ce cadre pour l'impression**
(pour renvoyer le cadre en 1200x1800 avec sa nouvelle géométrie).

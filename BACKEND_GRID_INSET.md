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

FRAME_DIR = os.path.expanduser("~/photobooth/static")
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

def validate_hole(value):
    try:
        h = {k: float(value[k]) for k in ("x", "y", "w", "h")}
        if h["x"] < 0 or h["y"] < 0 or h["w"] <= 0 or h["h"] <= 0:
            raise ValueError
        if h["x"] + h["w"] > 1.001 or h["y"] + h["h"] > 1.001:
            raise ValueError
        return h
    except (TypeError, KeyError, ValueError):
        return DEFAULT_HOLE

def build_grid(photo_paths, requested_hole=None):
    W, H = FINAL_SIZE
    # Priorité aux coordonnées envoyées avec CE montage. Cela évite définitivement
    # les anciens fichiers frame_hole.json, les mauvais chemins et les cadres changés.
    hole = validate_hole(requested_hole) if requested_hole else validate_hole(load_hole())
    ax, ay = int(hole["x"] * W), int(hole["y"] * H)
    aw, ah = int(hole["w"] * W), int(hole["h"] * H)

    tw = (aw - GAP) // 2
    th = (ah - GAP) // 2

    canvas = Image.new("RGB", (W, H), "white")
    positions = [(ax, ay), (ax + tw + GAP, ay), (ax, ay + th + GAP), (ax + tw + GAP, ay + th + GAP)]

    for path, (x, y) in zip(photo_paths[:4], positions):
        img = Image.open(path).convert("RGB")
        # "contain" : chaque photo reste entièrement visible, sans visage coupé.
        scale = min(tw / img.width, th / img.height)
        nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
        img = img.resize((nw, nh), Image.LANCZOS)
        tile = Image.new("RGB", (tw, th), "white")
        tile.paste(img, ((tw - nw) // 2, (th - nh) // 2))
        canvas.paste(tile, (x, y))

    return canvas
```

Puis appliquer le cadre :

```python
    frame = Image.open(FRAME_PNG).convert("RGBA").resize(FINAL_SIZE, Image.LANCZOS)
    out = canvas.convert("RGBA")
    out.alpha_composite(frame)
    out.convert("RGB").save(final_path, "JPEG", quality=92, optimize=True)
```

Dans la route `/create-grid`, récupérez impérativement le `hole` de la requête
et transmettez-le à la fonction (ne laissez pas `build_grid(photo_paths)` seul) :

```python
data = request.get_json(silent=True) or {}
canvas = build_grid(photo_paths, data.get("hole"))
```

### 3. Redéployer

```bash
sudo systemctl restart photobooth
```

Puis, sur la tablette : Paramètres → **Enregistrer ce cadre pour l'impression**
(pour renvoyer le cadre en 1200x1800 avec sa nouvelle géométrie).

# Cadre : photo paysage à l'endroit + infos de l'événement SOUS la photo

## Objectif

Le rendu final (1200x1800, portrait, inchangé) doit montrer les photos
**à l'endroit** (paysage 3:2) dans la zone photo du cadre, avec les infos de
l'événement **en dessous** — comme l'exemple d'impression validé.

Aujourd'hui les photos sont enregistrées "sur le côté" (caméra montée à 90°) :
c'est le frontend qui les tournait à l'affichage, ce qui rejetait le bandeau
texte sur le côté. Désormais le backend remet chaque photo à l'endroit avant
de l'insérer dans le cadre, et la photo ne doit **jamais être rognée**
("contain", jamais "cover").

## Règle unique (les 4 points à respecter)

1. Chaque photo est tournée de **90° antihoraire** AVANT insertion
   (le contenu paysage est remis à l'endroit, format paysage 3:2).
2. La photo (ou chaque case du montage 2x2) est insérée en **contain** dans la
   zone du trou (`hole`) : photo entière visible, aucun rognage.
3. La zone du trou (`hole`) est envoyée à CHAQUE requête par le frontend
   (cf. BACKEND_GRID_INSET.md). Nouvelle zone par défaut :
   `{"x": 0.05, "y": 0.065, "w": 0.90, "h": 0.40}` (photo paysage en haut,
   infos en dessous). Mettre à jour `DEFAULT_HOLE` côté backend avec ces valeurs.
4. `FINAL_SIZE` reste `(1200, 1800)`. **Aucune rotation du rendu final.**
   Les anciennes optimisations (resize 1200x1800, JPEG quality=92) restent
   valables — seule l'insertion dans le trou change.

## 1. Fonction utilitaire

```python
def upright(img):
    """Tourne la photo de 90° antihoraire (caméra montée à 90°) :
    le contenu paysage est remis à l'endroit."""
    return img.transpose(Image.Transpose.ROTATE_90)
```

## 2. Photo seule — /take-photo avec applyFrame=True

Remplacer le `resize(FINAL_SIZE)` + composite pleine page par une insertion
dans le trou (sinon le cadre rogne la photo) :

```python
W, H = FINAL_SIZE
hole = validate_hole(request_hole) if request_hole else validate_hole(load_hole())
ax, ay = int(hole["x"] * W), int(hole["y"] * H)
aw, ah = int(hole["w"] * W), int(hole["h"] * H)

img = upright(Image.open(photo_path).convert("RGB"))
# "contain" : la photo reste entière, aucune rognage
scale = min(aw / img.width, ah / img.height)
nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
img = img.resize((nw, nh), Image.LANCZOS)

canvas = Image.new("RGB", (W, H), hole.get("bg", "#ffffff"))
canvas.paste(img, (ax + (aw - nw) // 2, ay + (ah - nh) // 2))

frame = Image.open(FRAME_PNG).convert("RGBA").resize(FINAL_SIZE, Image.LANCZOS)
out = canvas.convert("RGBA")
out.alpha_composite(frame)
out.convert("RGB").save(final_path, "JPEG", quality=92, optimize=True)
```

Si `applyFrame=False` (photo brute pour le montage), garder l'enregistrement
de la photo telle quelle (sans rotation ni cadre).

## 3. Montage 2x2 — /create-grid

Dans `build_grid` (cf. BACKEND_GRID_INSET.md, toujours valable), appliquer
simplement la rotation avant le contain, pour chacune des 4 photos :

```python
    for path, (x, y) in zip(photo_paths[:4], positions):
        img = upright(Image.open(path).convert("RGB"))   # <-- NOUVEAU
        # "contain" : chaque photo reste entièrement visible, sans visage coupé.
        scale = min(tw / img.width, th / img.height)
        nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
        img = img.resize((nw, nh), Image.LANCZOS)
        tile = Image.new("RGB", (tw, th), hole.get("bg", "white"))
        tile.paste(img, ((tw - nw) // 2, (th - nh) // 2))
        canvas.paste(tile, (x, y))
```

Le reste de `build_grid` (hole par requête, couleur de fond) ne change pas.

## 4. Ne PAS toucher

- Impression, e-mail, QR, filtres : le fichier final est déjà à l'endroit,
  ces routes n'ont besoin d'aucune rotation.
- `FINAL_SIZE`, la qualité JPEG, les en-têtes Cache-Control (BACKEND_OPTIMIZATIONS.md).

## Déploiement

```bash
sudo systemctl restart photobooth
```

Puis sur la tablette : Paramètres → Cadre photo → **Enregistrer ce cadre pour
l'impression**. Le cadre a changé de forme (zone photo paysage), il doit être
renvoyé au backend.

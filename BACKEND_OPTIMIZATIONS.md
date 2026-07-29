# Optimisations backend validées (Raspberry Pi)

Ce document versionne les optimisations validées côté backend Flask/Picamera2,
afin qu'elles soient conservées lors des prochaines mises à jour.

## 1. Caméra : configuration vidéo au lieu de preview

```python
from picamera2 import Picamera2
from libcamera import controls

picam2 = Picamera2()
video_config = picam2.create_video_configuration(
    main={"size": (640, 360)},           # preview fluide, faible CPU
    controls={"FrameDurationLimits": (33333, 33333)},  # 30 FPS fixes
)
picam2.configure(video_config)

# Autofocus continu
picam2.set_controls({"AfMode": controls.AfModeEnum.Continuous})  # AfMode = 2

# Cadrage (ScalerCrop) — à ajuster selon l'objectif
picam2.set_controls({"ScalerCrop": (0, 0, 3456, 5184)})

picam2.start()
```

Résultat : preview nettement plus fluide, charge CPU réduite.

## 2. Un seul flux MJPEG

Le frontend n'ouvre plus qu'une seule connexion vers `/stream.mjpg`
(voir `src/services/cameraStream.ts`). Côté backend, garder un unique
générateur protégé par `threading.Lock` (cf. `BACKEND_PICAM_PATCH.md`).

## 3. Le montage 2x2 est généré par le backend

`/create-grid` est l'unique source de vérité : il renvoie `finalImage`.
Le frontend n'assemble plus de collage dans le navigateur (mémoire Chromium).

## 4. Réduction de la résolution des photos finales — IMPORTANT

Avant : résolution native 3456x5184 (plusieurs Mo par image) → cache Chromium
saturé, décodage lent, gels.

Après : redimensionnement en **1200x1800** avant l'application du cadre PNG,
puis sauvegarde JPEG `quality=92, optimize=True`.

```python
from PIL import Image

FINAL_SIZE = (1200, 1800)  # portrait 2:3

def prepare_final(photo_path: str, out_path: str, frame_path: str | None = None):
    img = Image.open(photo_path).convert("RGB")
    img = img.resize(FINAL_SIZE, Image.LANCZOS)

    if frame_path:
        frame = Image.open(frame_path).convert("RGBA").resize(FINAL_SIZE, Image.LANCZOS)
        img = img.convert("RGBA")
        img.alpha_composite(frame)
        img = img.convert("RGB")

    img.save(out_path, "JPEG", quality=92, optimize=True)
    return out_path
```

Résultats mesurés :

- fichiers ~250 Ko au lieu de plusieurs Mo ;
- mémoire fortement réduite ;
- cache Chromium beaucoup moins sollicité ;
- affichage plus rapide ;
- aucune perte visible sur l'écran de la tablette.

**Ne pas revenir en arrière sur cette optimisation.**

## 5. En-têtes HTTP recommandés pour les images finales

Pour éviter les images « fantômes » côté PWA :

```python
resp = send_file(path, mimetype="image/jpeg")
resp.headers["Cache-Control"] = "public, max-age=86400"
resp.headers["Accept-Ranges"] = "bytes"
return resp
```

# Patch backend Raspberry Pi — Prévisualisation PiCam robuste

Ce document décrit les modifications à appliquer **côté Raspberry Pi** (fichier
Flask du backend photobooth, généralement `app.py` ou `photobooth.py`).

Aucune modification frontend n'est nécessaire — seule la partie
**prévisualisation Pi Camera** est concernée. Les fonctions Canon EOS
(gphoto2), impression, QR codes, filtres, cadres, emails et les API existantes
**ne doivent pas être touchées**.

Compatibilité cible : Raspberry Pi OS Bookworm/Trixie · Picamera2 · libcamera
0.7+ · Raspberry Pi Camera V2 (IMX219).

---

## 1. Instance globale unique de `Picamera2`

En haut du fichier, une seule instance partagée + un verrou thread-safe :

```python
import logging
import threading
import time
import io

from picamera2 import Picamera2
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("photobooth")

picam2 = None
picam2_lock = threading.Lock()


def init_camera():
    """Initialise (ou ré-initialise) l'unique instance Picamera2."""
    global picam2
    with picam2_lock:
        if picam2 is not None:
            try:
                picam2.stop()
                picam2.close()
            except Exception:
                pass
            picam2 = None

        cam = Picamera2()
        # Ne PAS forcer RGB888 — laisser Picamera2 choisir le format adapté.
        preview_config = cam.create_preview_configuration(
            main={"size": (1280, 720)}
        )
        cam.configure(preview_config)
        cam.start()

        log.info("Camera initialized")
        log.info("Camera configuration: %s", preview_config)

        picam2 = cam
        return picam2


# Appel unique au démarrage du backend
init_camera()
```

**Règle importante** : ne jamais appeler `Picamera2()` dans une route Flask ou
dans `stream()`. Toujours réutiliser l'instance globale.

---

## 2. Générateur MJPEG robuste et thread-safe

```python
from flask import Response

FRAME_INTERVAL = 1 / 30  # ~30 fps max


def mjpeg_generator():
    global picam2
    while True:
        frame_bytes = None
        try:
            with picam2_lock:
                if picam2 is None:
                    raise RuntimeError("Camera not initialized")
                frame = picam2.capture_array()

            if frame is None or getattr(frame, "size", 0) == 0:
                # frame vide → on saute
                time.sleep(FRAME_INTERVAL)
                continue

            img = Image.fromarray(frame)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            frame_bytes = buf.getvalue()

        except Exception as e:
            log.error("Camera capture failed: %s", e)
            # Tentative de redémarrage automatique
            try:
                with picam2_lock:
                    if picam2 is not None:
                        try:
                            picam2.stop()
                        except Exception:
                            pass
                        try:
                            picam2.start()
                        except Exception:
                            # Reconstruction complète si start() échoue
                            init_camera()
            except Exception as e2:
                log.error("Camera restart failed: %s", e2)
            time.sleep(0.5)
            continue

        if frame_bytes:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
        time.sleep(FRAME_INTERVAL)


@app.route("/stream.mjpg")
def stream():
    return Response(
        mjpeg_generator(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )
```

Points-clés :
- `picam2_lock` protège chaque `capture_array()` → pas de conflit entre
  clients simultanés sur `/stream.mjpg`.
- Aucune exception ne remonte à Flask.
- Log **uniquement en cas d'erreur** (pas de log par frame).
- Restart automatique + pause 0,5 s avant nouvel essai.

---

## 3. Démarrage Flask sans double init

En bas du fichier :

```python
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        use_reloader=False,
    )
```

`use_reloader=False` évite que Flask ne lance deux processus (ce qui créerait
deux instances de `Picamera2` et provoquerait des conflits caméra).

---

## Déploiement sur le Pi

```bash
sudo systemctl stop photobooth
# éditer /opt/photobooth/app.py (ou le chemin exact)
sudo systemctl start photobooth
sudo journalctl -u photobooth -f
```

Vérifier ensuite :
```bash
curl -I http://10.42.0.1:5000/stream.mjpg
```
Puis ouvrir le flux dans un navigateur sur la tablette (via le hotspot).

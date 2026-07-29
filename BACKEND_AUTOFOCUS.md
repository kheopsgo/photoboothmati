# Autofocus continu — Raspberry Pi Camera Module 3

L'autofocus est **piloté par le backend** (Picamera2), pas par le frontend :
le navigateur ne fait qu'afficher le flux MJPEG. Voici le patch à appliquer
dans `app.py` sur le Raspberry Pi.

## 1. Import

```python
from picamera2 import Picamera2
from libcamera import controls
```

## 2. Activer l'autofocus continu au démarrage de la caméra

Juste après `cam.configure(...)` et **avant/après** `cam.start()` :

```python
def init_camera():
    global picam2
    with picam2_lock:
        ...
        cam = Picamera2()
        video_config = cam.create_video_configuration(
            main={"size": (640, 360)},
            controls={"FrameDurationLimits": (33333, 33333)},
        )
        cam.configure(video_config)
        cam.start()

        # --- AUTOFOCUS CONTINU (Camera Module 3) ---
        try:
            cam.set_controls({
                "AfMode": controls.AfModeEnum.Continuous,   # AF permanent
                "AfSpeed": controls.AfSpeedEnum.Fast,       # convergence rapide
                "AfRange": controls.AfRangeEnum.Normal,     # ou Macro si sujet < 30 cm
            })
            log.info("Autofocus continu activé")
        except Exception as e:
            log.warning("Autofocus non supporté par ce module: %s", e)

        picam2 = cam
        return picam2
```

> `AfSpeed` / `AfRange` n'existent que sur les modules AF (Camera Module 3).
> Le `try/except` évite de casser le démarrage avec une PiCam v2 (IMX219).

## 3. Déclencher un point de focus avant chaque photo (recommandé)

Dans la route de capture, juste avant le `capture_file(...)` :

```python
try:
    picam2.set_controls({"AfMode": controls.AfModeEnum.Auto})
    picam2.autofocus_cycle()          # bloquant, ~0,3–0,8 s
except Exception:
    pass
finally:
    picam2.set_controls({"AfMode": controls.AfModeEnum.Continuous})
```

Cela garantit une photo nette même si le sujet vient de bouger.

## 4. Route optionnelle « refocus » manuel

```python
@app.route("/autofocus", methods=["POST"])
def autofocus():
    try:
        with picam2_lock:
            picam2.set_controls({"AfMode": controls.AfModeEnum.Auto})
            ok = picam2.autofocus_cycle()
            picam2.set_controls({"AfMode": controls.AfModeEnum.Continuous})
        return {"success": bool(ok)}
    except Exception as e:
        return {"success": False, "error": str(e)}, 500
```

## 5. Déploiement

```bash
sudo systemctl restart photobooth
sudo journalctl -u photobooth -f | grep -i autofocus
```

Tu dois voir `Autofocus continu activé` dans les logs.

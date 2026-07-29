# 📁 Informations de stockage local et USB

Ce guide ajoute deux endpoints Flask pour afficher dans les paramètres :
- le **chemin exact** où les photos sont stockées sur le Raspberry Pi ;
- l’**état de la sauvegarde USB** (connectée ou non, espace disponible, nombre de photos).

---

## 🐍 Patch Flask (à ajouter dans `app.py`)

Ajoutez ce bloc **en haut** de votre `app.py` (avec les autres constantes) :

```python
import os
from pathlib import Path
from flask import jsonify

# Chemin local où les photos sont enregistrées.
# Adaptez-le si votre app.py utilise un autre dossier.
PHOTO_DIR = Path("/home/kheopsgo/photobooth-frontend/public/photos")

USB_MOUNT = "/media/usb"
USB_BACKUP_DIR = Path(USB_MOUNT) / "photobooth"
```

Puis ajoutez ces deux routes :

```python
@app.route("/storage-info", methods=["GET"])
def get_storage_info():
    """Renvoie le chemin local des photos et l'espace disque."""
    try:
        PHOTO_DIR.mkdir(parents=True, exist_ok=True)
        photo_count = len([p for p in PHOTO_DIR.glob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png")])

        st = os.statvfs(PHOTO_DIR)
        free_gb = (st.f_bavail * st.f_frsize) / (1024 ** 3)
        total_gb = (st.f_blocks * st.f_frsize) / (1024 ** 3)

        return jsonify({
            "localPath": str(PHOTO_DIR),
            "photoCount": photo_count,
            "freeGb": round(free_gb, 2),
            "totalGb": round(total_gb, 2),
        })
    except Exception as e:
        return jsonify({
            "localPath": str(PHOTO_DIR),
            "photoCount": 0,
            "error": str(e),
        }), 500


@app.route("/usb-status", methods=["GET"])
def get_usb_status():
    """Renvoie l'état de la clé USB."""
    try:
        if not os.path.ismount(USB_MOUNT):
            return jsonify({"connected": False})

        st = os.statvfs(USB_MOUNT)
        free_gb = (st.f_bavail * st.f_frsize) / (1024 ** 3)
        total_gb = (st.f_blocks * st.f_frsize) / (1024 ** 3)
        count = len(list(USB_BACKUP_DIR.glob("*.jpg"))) if USB_BACKUP_DIR.exists() else 0

        return jsonify({
            "connected": True,
            "freeGb": round(free_gb, 2),
            "totalGb": round(total_gb, 2),
            "photoCount": count,
        })
    except Exception as e:
        return jsonify({"connected": False, "error": str(e)}), 500
```

---

## ✅ Vérification

Redémarrez Flask :

```bash
sudo systemctl restart photobooth  # ou votre nom de service
```

Testez les endpoints depuis le Pi ou votre ordinateur connecté au même réseau :

```bash
curl http://10.42.0.1:5000/storage-info
curl http://10.42.0.1:5000/usb-status
```

Vous devriez obtenir quelque chose comme :

```json
{
  "localPath": "/home/kheopsgo/photobooth-frontend/public/photos",
  "photoCount": 42,
  "freeGb": 12.34,
  "totalGb": 28.50
}
```

```json
{
  "connected": true,
  "freeGb": 28.10,
  "totalGb": 59.40,
  "photoCount": 42
}
```

Si la clé USB n’est pas branchée, `/usb-status` renverra `{"connected": false}`.

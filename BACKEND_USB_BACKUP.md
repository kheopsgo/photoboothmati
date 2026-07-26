# 💾 Sauvegarde automatique des photos sur clé USB

Ce guide configure votre Raspberry Pi pour que **chaque photo prise soit automatiquement copiée sur la clé USB** branchée.

---

## 🚀 Installation automatique (recommandée)

Connectez-vous en SSH au Raspberry Pi, puis copiez-collez **ce bloc unique** :

```bash
curl -fsSL -o /tmp/setup_usb.sh <<'SCRIPT_EOF'
#!/bin/bash
set -e

echo "🔍 Détection de la clé USB..."
USB_DEV=$(lsblk -rno NAME,TRAN | awk '$2=="usb"{print $1}' | grep -E '[0-9]$' | head -n1)
if [ -z "$USB_DEV" ]; then
  echo "❌ Aucune clé USB détectée. Branchez-la et relancez."
  exit 1
fi
USB_DEV="/dev/$USB_DEV"
echo "✅ Clé trouvée : $USB_DEV"

UUID=$(sudo blkid -s UUID -o value "$USB_DEV")
FSTYPE=$(sudo blkid -s TYPE -o value "$USB_DEV")
echo "   UUID=$UUID  Type=$FSTYPE"

sudo mkdir -p /media/usb
if ! grep -q "/media/usb" /etc/fstab; then
  echo "UUID=$UUID /media/usb $FSTYPE defaults,nofail,uid=1000,gid=1000,umask=000 0 0" | sudo tee -a /etc/fstab
fi
sudo mount -a || true
sudo mkdir -p /media/usb/photobooth
sudo chown -R kheopsgo:kheopsgo /media/usb/photobooth || true

echo "✅ Clé montée sur /media/usb"
ls -lh /media/usb/

echo ""
echo "⚠️  Étape 2 : ajoutez ces lignes dans votre app.py Flask (voir ci-dessous)"
SCRIPT_EOF
bash /tmp/setup_usb.sh
```

---

## 🐍 Patch Flask (à ajouter dans `app.py`)

Ajoutez ce bloc **en haut** de votre `app.py` :

```python
import shutil, os
from pathlib import Path

USB_MOUNT = "/media/usb"
USB_BACKUP_DIR = Path(USB_MOUNT) / "photobooth"

def backup_to_usb(local_path):
    """Copie une photo sur la clé USB si elle est montée."""
    try:
        if not os.path.ismount(USB_MOUNT):
            return False
        USB_BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        dest = USB_BACKUP_DIR / Path(local_path).name
        shutil.copy2(local_path, dest)
        print(f"[USB] ✅ {dest.name}")
        return True
    except Exception as e:
        print(f"[USB] ❌ {e}")
        return False

def usb_status():
    """Renvoie l'état de la clé USB pour l'UI."""
    if not os.path.ismount(USB_MOUNT):
        return {"connected": False}
    try:
        st = os.statvfs(USB_MOUNT)
        free_gb = (st.f_bavail * st.f_frsize) / (1024**3)
        total_gb = (st.f_blocks * st.f_frsize) / (1024**3)
        count = len(list(USB_BACKUP_DIR.glob("*.jpg"))) if USB_BACKUP_DIR.exists() else 0
        return {
            "connected": True,
            "freeGb": round(free_gb, 2),
            "totalGb": round(total_gb, 2),
            "photoCount": count,
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}
```

Puis dans vos routes existantes, **après** la sauvegarde locale de chaque photo :

```python
# Dans /take-photo, après avoir écrit le fichier :
backup_to_usb(chemin_photo_locale)

# Dans /create-grid, après le montage final :
backup_to_usb(chemin_montage_final)
```

Enfin, ajoutez une route pour que l'admin puisse voir le statut :

```python
@app.route("/usb-status", methods=["GET"])
def get_usb_status():
    return jsonify(usb_status())
```

Redémarrez Flask :
```bash
sudo systemctl restart photobooth  # ou votre nom de service
```

---

## ✅ Vérification

1. Prenez une photo depuis la tablette.
2. Sur le Pi : `ls -lh /media/usb/photobooth/` → le fichier doit apparaître.
3. Les logs Flask affichent `[USB] ✅ photo_xxx.jpg`.
```

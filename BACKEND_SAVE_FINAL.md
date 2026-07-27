# Backend endpoint: `POST /save-final`

The tablette compose maintenant le rendu final (photo + cadre + rotation portrait) elle-même, puis l'envoie au Raspberry Pi via `POST /save-final`. Ceci garantit un rendu **WYSIWYG** identique entre l'aperçu tablette, le QR code, l'impression, l'e-mail et la sauvegarde USB.

## Contrat

**Requête**
```
POST /save-final
Content-Type: application/json

{
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "sessionId": "abc123"   // optionnel
}
```

**Réponse (200)**
```json
{
  "success": true,
  "url": "/photos/final-1730000000.png",
  "qrUrl": "/qr/final-1730000000.png"
}
```

`url` doit être servi statiquement par Flask (déjà le cas pour `/photos/`).
`qrUrl` est optionnel : si omis, la tablette génère un QR code côté client.

## Exemple d'implémentation Flask

```python
import base64, os, time, uuid
from pathlib import Path
from flask import request, jsonify
import qrcode

PHOTOS_DIR = Path("/home/kheopsgo/photobooth/photos")
QR_DIR = Path("/home/kheopsgo/photobooth/qr")
PUBLIC_BASE = "http://10.42.0.1:5000"  # ou l'URL publique du Drive côté invité

@app.route("/save-final", methods=["POST"])
def save_final():
    data = request.get_json(force=True)
    image_b64 = (data or {}).get("image", "")
    if not image_b64.startswith("data:image/"):
        return jsonify(success=False, message="Payload invalide"), 400

    header, _, b64 = image_b64.partition(",")
    ext = "png" if "png" in header else "jpg"
    name = f"final-{int(time.time())}-{uuid.uuid4().hex[:6]}.{ext}"
    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    dest = PHOTOS_DIR / name
    dest.write_bytes(base64.b64decode(b64))

    # Optionnel : sauvegarde USB si le script BACKEND_USB_BACKUP.md est installé
    try:
        backup_to_usb(str(dest))
    except NameError:
        pass

    # QR code pointant sur l'image publique
    QR_DIR.mkdir(parents=True, exist_ok=True)
    qr_name = name.rsplit(".", 1)[0] + ".png"
    qr_path = QR_DIR / qr_name
    qrcode.make(f"{PUBLIC_BASE}/photos/{name}").save(qr_path)

    return jsonify(
        success=True,
        url=f"/photos/{name}",
        qrUrl=f"/qr/{qr_name}",
    )
```

N'oubliez pas d'ajouter aussi les routes statiques :

```python
from flask import send_from_directory

@app.route("/qr/<path:fname>")
def serve_qr(fname):
    return send_from_directory(QR_DIR, fname)
```

## Rétrocompatibilité

Si `/save-final` n'est pas encore déployé, la tablette conserve le rendu localement (data URL) : l'affichage sur l'écran de résultat fonctionne, mais QR / e-mail / impression / sauvegarde USB sont désactivés le temps que l'endpoint soit ajouté.

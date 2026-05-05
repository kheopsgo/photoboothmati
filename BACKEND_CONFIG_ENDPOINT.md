# Endpoints `/config` à ajouter au backend Flask (Raspberry Pi)

Ajoutez ces routes dans votre application Flask (ex. `app.py`) sur le Raspberry.
Elles lisent/écrivent un fichier JSON persistant à `/home/kheopsgo/photobooth/config.json`.

```python
import json
import os
from flask import jsonify, request

CONFIG_PATH = "/home/kheopsgo/photobooth/config.json"

def _load_config():
    if not os.path.exists(CONFIG_PATH):
        return {}
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception:
        return {}

def _save_config(data):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    tmp = CONFIG_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, CONFIG_PATH)

@app.route("/config", methods=["GET"])
def get_config():
    return jsonify(_load_config())

@app.route("/config", methods=["POST"])
def post_config():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify({"success": False, "message": "Payload invalide"}), 400
    current = _load_config()
    current.update(payload)  # merge partiel
    try:
        _save_config(current)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    return jsonify(current)
```

N'oubliez pas d'autoriser CORS (déjà fait pour les autres routes en principe).

Le frontend appelle :
- `GET  /config` → `{ googleDriveUrl: "..." }`
- `POST /config` avec `{ googleDriveUrl: "..." }` → renvoie le config complet sauvegardé

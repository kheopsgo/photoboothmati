# Patch backend : scan des réseaux Wi-Fi (page /setup)

La page de configuration Wi-Fi de l'application appelle déjà
`GET /api/wifi/networks` (ou `/wifi-networks`) sur le Raspberry.
Il suffit d'ajouter cette route dans `app.py` pour que le bouton
« Scanner » affiche les réseaux environnants.

## Code à ajouter dans app.py

```python
import subprocess
from flask import jsonify

@app.route("/api/wifi/networks", methods=["GET"])
@app.route("/wifi-networks", methods=["GET"])
def wifi_networks():
    """Scanne les réseaux Wi-Fi environnants via nmcli."""
    try:
        # Forcer un rescan (ignore l'erreur si trop fréquent)
        subprocess.run(
            ["nmcli", "device", "wifi", "rescan"],
            capture_output=True, timeout=10,
        )
        out = subprocess.run(
            [
                "nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY",
                "device", "wifi", "list",
            ],
            capture_output=True, text=True, timeout=20,
        )
        networks = []
        for line in out.stdout.splitlines():
            parts = line.split(":")
            if len(parts) < 3:
                continue
            ssid = parts[0].strip()
            if not ssid:
                continue
            try:
                signal = int(parts[1])
            except ValueError:
                signal = 0
            security = parts[2].strip() or "open"
            networks.append({
                "ssid": ssid,
                "signal": signal,
                "security": security,
            })
        # Dédupliquer par SSID en gardant le meilleur signal
        best = {}
        for n in networks:
            if n["ssid"] not in best or n["signal"] > best[n["ssid"]]["signal"]:
                best[n["ssid"]] = n
        result = sorted(best.values(), key=lambda n: -n["signal"])
        return jsonify({"success": True, "networks": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
```

## Format de réponse attendu par l'application

```json
{
  "success": true,
  "networks": [
    { "ssid": "WiFi-Client", "signal": 82, "security": "WPA2" },
    { "ssid": "Freebox-1234", "signal": 45, "security": "WPA2" }
  ]
}
```

L'application accepte aussi un tableau brut `[ {...}, {...} ]`
ou un objet `{ "results": [...] }`.

## Vérification

Sur le Raspberry (ou depuis la tablette connectée au hotspot) :

```
curl http://10.42.0.1:5000/api/wifi/networks
```

Vous devez obtenir la liste JSON des réseaux. Ensuite, sur la page
http://10.42.0.1:5000/setup, le bouton « Scanner » affiche les réseaux
avec leur force de signal ; un toucher sur un réseau remplit
automatiquement le champ SSID.

## Prérequis

- `nmcli` (NetworkManager) doit être installé : `sudo apt install network-manager`
- Le service Flask doit avoir le droit d'exécuter `nmcli`
  (aucun droit root nécessaire pour un simple scan).

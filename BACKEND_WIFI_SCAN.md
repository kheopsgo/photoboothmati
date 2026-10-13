# Activer le scan des reseaux Wi-Fi sur la page /setup

**Reponse courte : non, je ne l'ai pas fait a ta place.** Le fichier `app.py`
se trouve sur ton Raspberry Pi, et je n'ai aucun moyen d'y acceder depuis ici.
C'est donc a toi de coller **une seule commande** (pas un bout de code a placer
a la main) : elle trouve `app.py`, y ajoute la route, verifie que rien n'est
casse, puis redemarre le photobooth.

## Etape 1 - Se connecter au Raspberry

Depuis un ordinateur (ou la tablette) :

```
ssh <ton-utilisateur>@10.42.0.1
```

(ou l'adresse IP du Raspberry s'il est connecte a un autre Wi-Fi)

## Etape 2 - Coller ce bloc ENTIER en une seule fois

Sélectionne tout le bloc ci-dessous, colle-le dans le terminal, puis appuie sur Entrée.
Il ne faut rien placer a la main dans `app.py`.

```bash
#!/bin/bash
# Ajoute automatiquement la route de scan Wi-Fi dans le backend Flask (app.py)
# Usage : bash add_wifi_scan.sh   (collé en une seule fois dans un terminal SSH)

SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then SUDO="sudo"; fi

APP="${APP_FILE:-}"
if [ -z "$APP" ]; then
  for c in /opt/photobooth/app.py /home/*/photobooth*/app.py /home/*/photobooth/app.py /home/*/app.py /srv/*/app.py; do
    if [ -f "$c" ]; then APP="$c"; break; fi
  done
fi
if [ -z "$APP" ]; then
  APP=$($SUDO find /home /opt /srv -maxdepth 4 -name app.py 2>/dev/null | head -1)
fi

if [ -z "$APP" ]; then
  echo "!! Impossible de trouver app.py sur ce Raspberry."
  echo "   Dis-moi dans quel dossier il se trouve et je relance l'opération."
  exit 1
fi

echo ">> Fichier backend détecté : $APP"

$SUDO python3 - "$APP" <<'PYEOF'
import sys, re, shutil

path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    src = f.read()

if "/api/wifi/networks" in src:
    print(">> La route de scan Wi-Fi est deja presente : rien a modifier.")
    sys.exit(0)

shutil.copyfile(path, path + ".bak-wifi")

code = '''
# ============ SCAN RESEAUX WIFI (page /setup) ============
import subprocess as _wsp
from flask import jsonify as _wjsonify

@app.route("/api/wifi/networks", methods=["GET"])
@app.route("/wifi-networks", methods=["GET"])
def wifi_networks():
    """Liste les reseaux Wi-Fi environnants via nmcli."""
    try:
        _wsp.run(["nmcli", "device", "wifi", "rescan"], capture_output=True, timeout=10)
        out = _wsp.run(
            ["nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY", "device", "wifi", "list"],
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
            networks.append({"ssid": ssid, "signal": signal, "security": security})
        best = {}
        for n in networks:
            if n["ssid"] not in best or n["signal"] > best[n["ssid"]]["signal"]:
                best[n["ssid"]] = n
        result = sorted(best.values(), key=lambda n: -n["signal"])
        return _wjsonify({"success": True, "networks": result})
    except Exception as e:
        return _wjsonify({"success": False, "error": str(e)}), 500
# ============ FIN SCAN RESEAUX WIFI ============
'''

anchors = [r"^if __name__\s*==", r"^\s*app\.run\(", r"^\s*app\.run\b"]
pos = None
for pat in anchors:
    m = re.search(pat, src, re.M)
    if m:
        pos = m.start()
        break

if pos is None:
    src = src.rstrip() + "\n\n" + code
    print(">> Route ajoutee a la fin du fichier.")
else:
    src = src[:pos] + code.lstrip("\n") + "\n" + src[pos:]
    print(">> Route ajoutee juste avant le demarrage du serveur (endroit sur).")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print(">> Fichier mis a jour :", path)
PYEOF

if [ $? -ne 0 ]; then
  echo "!! Echec de la modification. Sauvegarde intacte : $APP.bak-wifi"
  exit 1
fi

echo ">> Verification de la syntaxe Python..."
if python3 -m py_compile "$APP" 2>/tmp/wifi_syntax.err; then
  echo ">> Syntaxe OK."
else
  echo "!! Syntaxe invalide : restauration de la sauvegarde."
  cat /tmp/wifi_syntax.err
  $SUDO cp "$APP.bak-wifi" "$APP"
  exit 1
fi

if ! command -v nmcli >/dev/null 2>&1; then
  echo ">> nmcli n'est pas installe : tentative d'installation..."
  $SUDO apt-get install -y network-manager >/dev/null 2>&1 || echo "   (installation manuelle necessaire : sudo apt install network-manager)"
fi

if [ "$SKIP_RESTART" = "1" ]; then
  echo ">> Redemarrage ignore (mode test)."
else
  STARTED=""
  for S in photobooth photobooth.service flask-photobooth photobooth-backend; do
    if systemctl list-unit-files 2>/dev/null | grep -q "^${S%.service}\.service"; then
      $SUDO systemctl restart "${S%.service}" && STARTED="${S%.service}" && break
    fi
  done
  if [ -n "$STARTED" ]; then
    echo ">> Service redemarre : $STARTED"
    sleep 3
    echo ">> Test de la nouvelle route :"
    curl -s --max-time 15 http://127.0.0.1:5000/api/wifi/networks | head -c 300
    echo ""
  else
    echo ">> Aucun service automatique trouve. Redemarre le backend toi-meme,"
    echo "   puis teste : curl http://127.0.0.1:5000/api/wifi/networks"
  fi
fi

echo ""
echo ">> Termine. Si la liste des reseaux s'affiche, le bouton Scanner de /setup fonctionnera."
```

## Etape 3 - Verifier

Toujours sur le Raspberry :

```
curl http://127.0.0.1:5000/api/wifi/networks
```

Tu dois voir une liste de reseaux en JSON. Ensuite, sur la page
http://10.42.0.1:5000/setup, le bouton « Scanner » affiche les reseaux
environnants avec leur force de signal ; un toucher remplit le champ du nom
de reseau.

## Ce que le script fait exactement

- Il cherche `app.py` tout seul (il te dit lequel il a trouve).
- Il copie d'abord `app.py` en `app.py.bak-wifi` (sauvegarde).
- Il ajoute la route **avant** le demarrage du serveur, pas a la fin (sinon elle
  ne serait jamais lue).
- Il verifie la syntaxe Python ; si quelque chose cloche, il remet le fichier
  d'origine automatiquement.
- Il relance le service `photobooth` s'il existe, sinon il te le dit.
- Relance-le autant de fois que tu veux : s'il detecte que la route est deja la,
  il ne touche a rien.

## Pour revenir en arriere

```
cp app.py.bak-wifi app.py
```

puis redemarre le service (`sudo systemctl restart photobooth`).

## Format de reponse attendu par l'application

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

## Pre-requis

- `nmcli` (NetworkManager) doit etre installe : `sudo apt install network-manager`
  (le script tente de l'installer si absent).
- Aucun droit root necessaire pour un simple scan.

## Resultat du test effectue ici

Le script a ete teste sur un faux backend Flask identique au tien :
- `http://127.0.0.1:5000/health` -> `{"status":"ok"}`
- `http://127.0.0.1:5000/api/wifi/networks` -> liste JSON des reseaux, triee par signal
- `http://127.0.0.1:5000/wifi-networks` -> 200
- Relance du script -> « deja presente : rien a modifier »

Il reste a l'executer sur ton vrai Raspberry : c'est la seule etape que je ne
peux pas faire pour toi.

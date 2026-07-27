# Mise à jour du Raspberry Pi en SSH

Si le bouton web affiche encore `signal is aborted`, le plus fiable est de lancer la mise à jour directement en SSH sur le Raspberry. Cette erreur arrive souvent parce que le serveur redémarre pendant la requête HTTP : la mise à jour peut être lancée, mais le navigateur croit que l'appel a échoué.

Sur ce Raspberry, le frontend se trouve dans `~/photobooth-frontend` et les services systemd sont :

- `photobooth-frontend.service` (sert le build Vite)
- `photobooth-backend.service` (Flask / backend Python)

## 1. Se connecter au Raspberry

```bash
ssh kheopsgo@10.42.0.1
```

## 2. Aller dans le dossier du frontend

```bash
cd ~/photobooth-frontend
```

## 3. Sauvegarder les changements locaux éventuels

```bash
git status
```

Si des fichiers sont modifiés et que vous voulez les garder :

```bash
git stash push -m "sauvegarde avant mise a jour"
```

## 4. Télécharger la dernière version

```bash
git pull
```

Si Git refuse à cause de fichiers locaux non importants :

```bash
git reset --hard
git pull
```

## 5. Corriger les permissions si besoin

Si un précédent build a été lancé avec `sudo`, le dossier `dist/` peut appartenir à `root` et empêcher le nouveau build :

```bash
sudo rm -rf ~/photobooth-frontend/dist
sudo chown -R kheopsgo:kheopsgo ~/photobooth-frontend
```

## 6. Installer les dépendances et reconstruire

```bash
npm install
npm run build
```

## 7. Redémarrer le service frontend

```bash
sudo systemctl restart photobooth-frontend.service
```

Si vous avez aussi modifié le backend Python, redémarrez aussi :

```bash
sudo systemctl restart photobooth-backend.service
```

## 8. Vérifier

```bash
curl http://localhost:5000/health
```

Puis ouvrez sur la tablette :

```text
http://10.42.0.1:5000/
```

## Commande complète en une ligne

```bash
cd ~/photobooth-frontend && git pull && npm install && npm run build && sudo systemctl restart photobooth-frontend.service
```

## Endpoint backend recommandé

Pour éviter définitivement l'erreur côté bouton web, la route `/update-frontend` du backend Flask doit répondre immédiatement, puis lancer la mise à jour en arrière-plan :

```python
import subprocess
import threading
from flask import jsonify

PROJECT_DIR = "/home/kheopsgo/photobooth-frontend"
FRONTEND_SERVICE = "photobooth-frontend.service"

def run_update():
    subprocess.run(
        f"cd {PROJECT_DIR} && git pull && npm install && npm run build && sudo systemctl restart {FRONTEND_SERVICE}",
        shell=True,
        check=False,
    )

@app.route("/update-frontend", methods=["POST"])
def update_frontend():
    threading.Thread(target=run_update, daemon=True).start()
    return jsonify({
        "success": True,
        "message": "Mise à jour lancée en arrière-plan.",
        "reloadDelayMs": 90000,
    })
```

# Mise à jour du Raspberry Pi en SSH

Si le bouton web affiche encore `signal is aborted`, le plus fiable est de lancer la mise à jour directement en SSH sur le Raspberry. Cette erreur arrive souvent parce que le serveur redémarre pendant la requête HTTP : la mise à jour peut être lancée, mais le navigateur croit que l'appel a échoué.

## 1. Se connecter au Raspberry

Depuis un ordinateur sur le même Wi-Fi / hotspot :

```bash
ssh pi@10.42.0.1
```

Si l'IP est différente, depuis la page admin récupérez l'IP affichée, puis :

```bash
ssh pi@IP_DU_RASPBERRY
```

## 2. Aller dans le dossier du photobooth

Essayez d'abord :

```bash
cd ~/photobooth
```

Si le dossier n'existe pas :

```bash
ls ~
```

puis entrez dans le dossier du projet.

## 3. Sauvegarder les changements locaux éventuels

```bash
git status
```

Si `git status` affiche des fichiers modifiés que vous voulez garder :

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

## 5. Installer les dépendances et reconstruire

Selon ce qui est utilisé sur le Raspberry :

```bash
npm install
npm run build
```

ou :

```bash
bun install
bun run build
```

## 6. Redémarrer le service

Cherchez le nom du service :

```bash
systemctl --user list-units | grep -i photo
systemctl list-units | grep -i photo
```

Puis redémarrez le service trouvé, par exemple :

```bash
sudo systemctl restart photobooth
```

ou, si le service utilisateur est utilisé :

```bash
systemctl --user restart photobooth
```

## 7. Vérifier

```bash
curl http://localhost:5000/health
```

Puis ouvrez :

```text
http://10.42.0.1:5000/
```

## Variante rapide en une commande

À adapter avec le bon dossier et le bon service :

```bash
cd ~/photobooth && git pull && npm install && npm run build && sudo systemctl restart photobooth
```

## Endpoint backend recommandé

Pour éviter définitivement l'erreur côté bouton web, la route `/update-frontend` du backend Flask doit répondre immédiatement, puis lancer la mise à jour en arrière-plan. Exemple :

```python
import subprocess
import threading
from flask import jsonify

PROJECT_DIR = "/home/pi/photobooth"
SERVICE_NAME = "photobooth"

def run_update():
    subprocess.run(
        "git pull && npm install && npm run build && sudo systemctl restart " + SERVICE_NAME,
        cwd=PROJECT_DIR,
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

#!/bin/bash
# Ajoute la copie de la photo d'origine (sans cadre) sur la cle USB en mode 1 photo
SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then SUDO="sudo"; fi
APP="${APP_FILE:-/home/kheopsgo/photobooth/app.py}"
[ -f "$APP" ] || { echo "!! app.py introuvable : $APP"; exit 1; }
$SUDO cp "$APP" "$APP.bak-usborig"

$SUDO python3 - "$APP" <<'PYEOF'
import sys
path = sys.argv[1]
src = open(path, encoding="utf-8").read()
if "USB-ORIGINAL-SINGLE" in src:
    print(">> Deja installe, rien a faire."); sys.exit(0)
anchor = '            usb_category = "Originals" if part_of_grid or raw else "Prints"\n'
if src.count(anchor) != 1:
    print("!! Endroit a modifier introuvable"); sys.exit(1)
add = ('            # USB-ORIGINAL-SINGLE : copie aussi la photo sans cadre\n'
       '            if final != f:\n'
       '                queue_usb_backup(os.path.join(PHOTO_DIR, f), "Originals")\n')
src = src.replace(anchor, add + anchor)
open(path, "w", encoding="utf-8").write(src)
print(">> Copie des originaux ajoutee pour le mode 1 photo")
PYEOF
[ $? -ne 0 ] && { echo "!! Echec. Rien n'a ete change."; exit 1; }

if ! python3 -m py_compile "$APP" 2>/tmp/usborig.err; then
  echo "!! Erreur : restauration de la sauvegarde."; cat /tmp/usborig.err
  $SUDO cp "$APP.bak-usborig" "$APP"; exit 1
fi

for S in photobooth flask-photobooth photobooth-backend; do
  if systemctl list-unit-files 2>/dev/null | grep -q "^$S\.service"; then
    $SUDO systemctl restart "$S" && echo ">> Service redemarre : $S" && break
  fi
done
echo ">> Termine ! Fais une photo en mode 1 photo puis verifie le dossier Originals."

#!/bin/bash
# Installe un nettoyage automatique quotidien des photos du photobooth (garde 30 jours).
# Les photos sont déjà sauvegardées sur la clé USB : seules les copies du Raspberry sont supprimées.
set -e
APP_DIR=/home/kheopsgo/photobooth
SCRIPT=/usr/local/bin/photobooth-cleanup.sh

sudo tee "$SCRIPT" >/dev/null <<'EOF'
#!/bin/bash
APP_DIR=/home/kheopsgo/photobooth
DAYS=30
LOG=/var/log/photobooth-cleanup.log
for d in "$APP_DIR/photos" "$APP_DIR/static/photos" "$APP_DIR/captures" "$APP_DIR/static/captures" "$APP_DIR/output" "$APP_DIR/trash"; do
  [ -d "$d" ] || continue
  n=$(find "$d" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -mtime +$DAYS | wc -l)
  find "$d" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -mtime +$DAYS -delete
  find "$d" -mindepth 1 -type d -empty -delete
  echo "$(date '+%F %T') $d : $n fichier(s) supprimé(s)" >> "$LOG"
done
# Sécurité : si le disque est plein à plus de 90 %, on supprime aussi les plus anciennes au-delà de 7 jours.
use=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "$use" -ge 90 ]; then
  for d in "$APP_DIR/photos" "$APP_DIR/static/photos" "$APP_DIR/captures" "$APP_DIR/output" "$APP_DIR/trash"; do
    [ -d "$d" ] && find "$d" -type f -mtime +7 -delete
  done
  echo "$(date '+%F %T') disque à ${use}% : nettoyage d'urgence" >> "$LOG"
fi
EOF
sudo chmod +x "$SCRIPT"
( sudo crontab -l 2>/dev/null | grep -v photobooth-cleanup ; echo "30 4 * * * $SCRIPT" ; echo "@reboot sleep 60 && $SCRIPT" ) | sudo crontab -
sudo "$SCRIPT"
echo "✅ Nettoyage automatique installé (tous les jours à 4h30 et au démarrage)."
df -h / | tail -1
tail -n 6 /var/log/photobooth-cleanup.log

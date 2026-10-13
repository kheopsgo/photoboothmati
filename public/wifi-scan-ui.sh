#!/bin/bash
# Ajoute le bouton "Scanner les reseaux" sur la page /setup du Raspberry
SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then SUDO="sudo"; fi
APP="${APP_FILE:-/home/kheopsgo/photobooth/app.py}"
[ -f "$APP" ] || { echo "!! app.py introuvable : $APP"; exit 1; }
echo ">> Fichier : $APP"
$SUDO cp "$APP" "$APP.bak-scanui"

$SUDO python3 - "$APP" <<'PYEOF'
import sys
path = sys.argv[1]
src = open(path, encoding="utf-8").read()
if "WIFI-SCAN-UI" in src:
    print(">> Bouton deja present, rien a faire."); sys.exit(0)
start = src.find("def setup_page")
if start < 0:
    print("!! Page setup introuvable"); sys.exit(1)
end = src.find("</body>", start)
if end < 0:
    print("!! Fin de page introuvable"); sys.exit(1)
block = '''
<!-- WIFI-SCAN-UI -->
<div style="max-width:420px;margin:20px auto;background:#222;padding:25px;border-radius:16px;">
  <button type="button" id="wsBtn" style="width:100%;padding:14px;font-size:16px;border-radius:10px;border:none;background:white;color:black;font-weight:bold;">Scanner les reseaux WiFi</button>
  <div id="wsList" style="margin-top:12px;"></div>
</div>
<script>
(function(){
  var btn=document.getElementById('wsBtn'), list=document.getElementById('wsList');
  function pick(ssid){
    var inp=document.querySelector('input[name=ssid],#ssid')||document.querySelector('input:not([type=password])');
    if(inp){inp.value=ssid;inp.scrollIntoView({behavior:'smooth',block:'center'});}
    var pw=document.querySelector('input[type=password]'); if(pw){pw.focus();}
  }
  btn.onclick=function(){
    btn.disabled=true; btn.textContent='Recherche en cours...'; list.innerHTML='';
    fetch('/api/wifi/networks').then(function(r){return r.json();}).then(function(d){
      var nets=(d&&d.networks)||[];
      if(!nets.length){list.innerHTML='<p style="color:#ccc">Aucun reseau trouve.</p>';}
      nets.forEach(function(n){
        var b=document.createElement('button'); b.type='button';
        b.style.cssText='width:100%;padding:12px;margin-top:8px;font-size:15px;border-radius:10px;border:1px solid #444;background:#333;color:white;text-align:left;';
        b.textContent=(n.security&&n.security!=='--'?'[cle] ':'')+n.ssid+'  ('+(n.signal||0)+'%)';
        b.onclick=function(){pick(n.ssid);}; list.appendChild(b);
      });
    }).catch(function(){list.innerHTML='<p style="color:#f88">Erreur pendant le scan.</p>';})
    .then(function(){btn.disabled=false; btn.textContent='Scanner les reseaux WiFi';});
  };
})();
</script>
'''
src = src[:end] + block + src[end:]
open(path, "w", encoding="utf-8").write(src)
print(">> Bouton ajoute a la page /setup")
PYEOF
[ $? -ne 0 ] && { echo "!! Echec. Sauvegarde intacte."; exit 1; }

if ! python3 -m py_compile "$APP" 2>/tmp/scanui.err; then
  echo "!! Erreur : restauration de la sauvegarde."; cat /tmp/scanui.err
  $SUDO cp "$APP.bak-scanui" "$APP"; exit 1
fi

for S in photobooth flask-photobooth photobooth-backend; do
  if systemctl list-unit-files 2>/dev/null | grep -q "^$S\.service"; then
    $SUDO systemctl restart "$S" && echo ">> Service redemarre : $S" && break
  fi
done
echo ""
echo ">> Termine ! Rafraichis http://10.42.0.1:5000/setup"

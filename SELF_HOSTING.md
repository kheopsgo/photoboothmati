# Auto-hébergement sur Raspberry Pi

## Prérequis

- Node.js 18+ installé sur le Pi (ou build sur un autre PC)
- Le backend Flask tourne sur `http://10.10.10.191:5000`

## 1. Cloner / copier le projet

```bash
git clone <repo-url> photobooth-frontend
cd photobooth-frontend
```

## 2. Installer les dépendances

```bash
npm install
```

## 3. Configurer l'URL du backend

Éditer `.env.production` :

```
VITE_API_BASE=http://10.10.10.191:5000
```

Adapter l'IP si nécessaire.

## 4. Build de production

```bash
npm run build
```

Les fichiers statiques sont générés dans `dist/`.

## 5. Servir les fichiers

Option A — avec `serve` (simple) :

```bash
npx serve dist -l 3000
```

Option B — avec nginx :

```nginx
server {
    listen 80;
    root /home/pi/photobooth-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 6. Accéder depuis la tablette

Ouvrir sur la tablette (même réseau Wi-Fi) :

```
http://<IP_DU_PI>:3000
```

## Notes

- L'URL de l'API est configurable dans `.env.production` via `VITE_API_BASE`
- Le frontend est 100% statique (pas de serveur Node en production)
- Tous les textes sont en français

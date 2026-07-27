# Plan : quick wins fiabilité technique

## Objectif
Rendre l'application plus robuste sur tablette Android, réduire les faux positifs "hors ligne", éviter les blocages de l'UI, et faciliter le débogage à distance. Aucune modification backend.

## 1. Polling backend plus intelligent
### Problème actuel
`BackendHealthContext` appelle `/health` toutes les 5 s sans distinction de réseau. Depuis la preview Lovable (HTTPS), la requête vers `http://10.42.0.1:5000` est bloquée, ce qui remplit les logs d'erreurs et met l'application en mode "hors ligne" (bouton Démarrer désactivé).

### Solution
- Détecter qu'on est dans la preview Lovable ou sur un hôte non-Pi (`localhost`, `lovable.app`, etc.).
- Dans ce cas, passer l'état en `unknown` (ni en ligne ni hors ligne) et réduire drastiquement le polling (toutes les 30 s, ou l'arrêter).
- Sur le vrai réseau du Pi, garder le polling 5 s.
- Ajouter un backoff exponentiel quand le backend passe hors ligne : 5 s → 10 s → 20 s → 30 s max.
- Ajouter un bouton "Vérifier la connexion" dans l'overlay offline pour forcer un check immédiat.

### Fichiers concernés
- `src/contexts/BackendHealthContext.tsx`
- `src/components/photobooth/WelcomeScreen.tsx` (adapter le disabled du bouton Démarrer)
- `src/lib/environment.ts` (nouveau helper)

## 2. Timeout et annulation sur toutes les requêtes API
### Problème actuel
Seul `/health` utilise un `AbortController` + timeout. Les appels `/take-photo`, `/create-grid`, `/send-email`, `/print-photo` peuvent rester en attente indéfiniment si le backend rame.

### Solution
- Créer un helper `fetchWithTimeout(url, options, timeoutMs)` dans `src/services/api.ts`.
- L'appliquer à toutes les fonctions API (`takePhoto`, `takeSinglePhoto`, `createGrid`, `sendEmail`, `printPhoto`, `getConfig`, `saveConfig`, etc.).
- Définir des timeouts cohérents : 15 s pour une photo, 30 s pour `create-grid`, 10 s pour email/print/config.
- Afficher un message clair à l'utilisateur en cas de timeout.

### Fichiers concernés
- `src/services/api.ts`
- `src/components/photobooth/CaptureFlow.tsx` (gestion du message d'erreur)
- `src/components/photobooth/ResultScreen.tsx` (gestion email/print)

## 3. Fallback caméra + cache-busting
### Problème actuel
Si le flux MJPEG de la PiCam ne charge pas, l'écran reste noir sans indication. De plus, le navigateur peut garder une frame obsolète en cache.

### Solution
- Dans le composant `RotatedPortraitImage`, ajouter un `onError` qui affiche un message "Caméra indisponible" + bouton "Réessayer".
- Ajouter un paramètre `?t=Date.now()` à l'URL du stream pour éviter le cache.
- Lors d'un échec de chargement du flux en preview/settings, proposer automatiquement de désactiver temporairement l'aperçu caméra.

### Fichiers concernés
- `src/components/photobooth/RotatedPortraitImage.tsx`
- `src/components/photobooth/PreviewScreen.tsx`
- `src/components/photobooth/CountdownScreen.tsx`
- `src/components/photobooth/SettingsPanel.tsx`

## 4. Service Worker : ne jamais servir les API/stream depuis le cache
### Problème actuel
`public/sw.js` est minimal. Si un jour il commence à mettre en cache, il pourrait servir une photo ancienne ou bloquer le flux quand le backend est injoignable.

### Solution
- Garder le SW minimal mais ajouter explicitement une stratégie `NetworkOnly` pour :
  - `/health`, `/take-photo`, `/create-grid`, `/send-email`, `/print-photo`, `/stream.mjpg`
  - toute URL commençant par `/api/`
- Conserver le cache uniquement pour les assets statiques (`index.html`, JS, CSS, icônes).

### Fichiers concernés
- `public/sw.js`

## 5. Error Boundary global + infos de débogage dans l'Admin
### Problème actuel
Une erreur React non catchée (par exemple un `JSON.parse` corrompu ou une image malformée) peut laisser l'écran blanc. De plus, il est difficile de savoir quelle version du frontend est déployée sur la tablette.

### Solution
- Ajouter un `ErrorBoundary` autour de `ScreenRouter` dans `PhotoboothApp.tsx`.
- En cas d'erreur, afficher un écran "Oups, un problème est survenu" avec un bouton "Retour à l'accueil" qui appelle `restart()`.
- Dans la page Admin (`/#/admin`), ajouter une ligne :
  - Version du build (date/heure de compilation via `import.meta.env.VITE_BUILD_TIME` ou `new Date().toISOString()` au build)
  - État du backend (online/offline/unknown)
  - Dernière erreur React capturée (si possible)

### Fichiers concernés
- `src/components/photobooth/PhotoboothApp.tsx`
- `src/components/photobooth/ErrorBoundary.tsx` (nouveau)
- `src/pages/PhotoboothAdminPro.tsx`
- `vite.config.ts` (définir `VITE_BUILD_TIME`)

## Non inclus
- Aucune modification du backend Flask / Raspberry Pi.
- Aucun changement sur la logique de capture, d'impression ou de cadre.
- Aucune nouvelle fonctionnalité métier (partage SMS, GIF, etc.).

## Livrables attendus
- Moins de bruit réseau en preview Lovable.
- L'UI ne se bloque plus si le backend met du temps à répondre.
- Un message clair quand la caméra ne charge pas.
- Un écran de secours en cas d'erreur React.
- Des infos de version/d'état visibles dans l'Admin.


## Le vrai problème du cadre

Aujourd'hui il y a **trois représentations différentes** de la même photo, ce qui explique la divergence :

1. **Aperçu Paramètres** : `PhotoFrame` React affiché autour d'un placeholder portrait 3:4 → exporté en PNG 1200×1600 transparent envoyé au backend via `/frame-upload`.
2. **Écran Résultat (tablette)** : la photo JPEG brute (paysage 1280×720 venue de la PiCam) est affichée via `RotatedPortraitImage` qui la **pivote de -90° et la rogne en CSS** en 3:4 — **sans jamais afficher le cadre PhotoFrame**.
3. **Fichier réellement envoyé/imprimé/mailé** : c'est l'URL renvoyée par le backend (`finalImage`). Selon ce que fait `app.py`, c'est soit le JPEG paysage brut, soit le composite avec le PNG de cadre uploadé — mais rien ne garantit que l'orientation, le ratio et la position du "trou" correspondent au cadre uploadé.

Résultat : ce que l'invité voit à l'écran ≠ ce qu'il reçoit par mail/QR/impression ≠ l'aperçu du cadre en Paramètres.

## Objectif

Le **même artefact visuel** doit apparaître partout : aperçu Paramètres, écran Résultat, mail, QR, impression.

## Plan

### 1. Générer le rendu final côté frontend (source de vérité unique)

Créer `src/services/finalRender.ts` : une fonction `composeFinalImage(photos, mode)` qui produit un `Blob`/dataURL PNG en composant sur un canvas :
- Fond : `PhotoFrame` (le même composant React déjà utilisé en Paramètres) rendu via `html-to-image` à 1200×1600 (single) ou 1600×1600 (grille 2×2).
- Trou photo : la (les) photo(s) capturée(s), pivotée(s) -90° et rognée(s) en 3:4 (même logique que `RotatedPortraitImage`, mais appliquée sur canvas au lieu du CSS).

Cette image devient `finalImage` dans le contexte. Le backend n'a plus à composer quoi que ce soit.

### 2. Utiliser ce rendu partout

- `CaptureFlow` : après la (ou les 4) capture(s), appeler `composeFinalImage` et stocker le dataURL comme `finalImage`.
- `ResultScreen` : afficher directement `finalImage` (fini `RotatedPortraitImage` + grille CSS séparée). Un seul `<img>`, pixel-perfect identique au fichier envoyé.
- `sendEmail` / `printPhoto` : envoyer le dataURL du composite (ajouter un endpoint backend qui accepte un base64 au lieu d'un chemin, OU uploader d'abord via un nouvel appel `/upload-final` qui retourne un chemin).
- QR : pointer vers ce composite (le fallback client-side qu'on vient d'ajouter marchera naturellement).

### 3. Simplifier Paramètres

- Supprimer le bouton "Enregistrer ce cadre pour l'impression" (`SaveFrameButton`) — plus nécessaire puisque le cadre est appliqué en direct à chaque photo.
- Garder la sélection de style + l'aperçu live du `PhotoFrame`.
- Le cadre change immédiatement, sans redéploiement ni upload backend.

### 4. Polissage "rendu pro" (indépendant du cadre)

Améliorations visuelles à ajouter dans la même passe :

- **Cadres retravaillés** : uniformiser les 5 styles (`elegant`, `minimal`, `botanical`, `geometric`, `polaroid`) avec :
  - Marges internes cohérentes et ratio identique 3:4 (single) / 1:1 (grille).
  - Typographies chargées depuis Google Fonts (Cormorant, Playfair, DM Serif) au lieu des fonts système actuelles.
  - Ornements SVG vectoriels nets (les traits actuels sont trop fins et pixelisent à l'impression).
  - Pour la grille 4 photos : un vrai passe-partout unique (fond + marges autour + entre les 4 vignettes) au lieu de 4 cases juxtaposées.
- **Cohérence colorimétrique** : appliquer le filtre (`none` / `bw` / `sepia`) côté canvas dans `composeFinalImage`, pour que l'aperçu et le fichier final soient identiques (aujourd'hui le filtre est demandé au backend, résultat variable).
- **Watermark / footer** : intégré nativement dans le PNG final (plus juste en overlay CSS sur ResultScreen).
- **Qualité export** : PNG haute résolution (2400×3200 pour print, downscale à 1200×1600 pour email/QR) pour ne plus imprimer flou.
- **Écran Résultat** : montrer un badge discret "Souvenir prêt" + petite animation "révélation Polaroid" une seule fois sur le composite final (plus fidèle qu'aujourd'hui).

### 5. Ce qui reste côté Raspberry Pi

Rien de nouveau à installer. Le backend continue simplement de :
- Recevoir la photo brute PiCam (inchangé).
- Retourner son URL au frontend (inchangé).
- Accepter le composite final via un petit ajout d'endpoint `/save-final` (base64 → fichier) pour que l'email/impression/USB backup sauvegardent le **bon** fichier. Un fichier `.md` sera fourni comme les précédents (BACKEND_PICAM_PATCH.md, etc.) avec le code Python à copier-coller.

## Détails techniques

- `html-to-image` est déjà installé (utilisé par `frameOverlay.ts`).
- La composition finale utilise l'API Canvas 2D standard : `drawImage` avec `rotate(-Math.PI/2)` et `clip()` pour le trou.
- `composeFinalImage` est asynchrone (chargement des images + rendu HTML) — afficher un spinner "Création de votre souvenir…" pendant ~500-800 ms sur `ResultScreen`.
- Les 4 photos en mode grille sont composées en 2×2 dans le trou principal, chacune rognée 3:4 et pivotée, avec fine marge blanche entre elles.

## Fichiers touchés

- Ajout : `src/services/finalRender.ts`, `BACKEND_SAVE_FINAL.md`.
- Modifiés : `PhotoFrame.tsx` (fonts + ornements retravaillés + variante `strip`), `CaptureFlow.tsx`, `ResultScreen.tsx`, `SettingsPanel.tsx` (suppression `SaveFrameButton`), `services/api.ts` (nouvelle route `/save-final`), `contexts/PhotoboothContext.tsx` (typage `finalImage` accepte dataURL).
- Inchangés : logique caméra, health, WiFi, admin.

## À valider avec vous avant de coder

1. **OK pour supprimer le bouton "Enregistrer ce cadre" ?** Le cadre sera appliqué automatiquement à chaque photo, sans étape manuelle.
2. **OK pour composer le rendu final côté tablette** (au lieu du backend Pi) ? Avantage : WYSIWYG total. Inconvénient : ~500 ms d'attente supplémentaire après la capture.
3. **Voulez-vous que je retravaille aussi les 5 styles de cadres** (typographies pro, ornements plus nets, passe-partout unique pour la grille 4 photos) ou uniquement corriger le mismatch actuel ?

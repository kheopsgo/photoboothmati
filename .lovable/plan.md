# Plan : améliorer l'expérience invité

## Objectif
Rendre le photobooth plus immersif, festif et rassurant pour les invités, tout en restant simple à utiliser sur tablette Android paysage.

## 1. Compte à rebours plus théâtral
- Remplacer l'affichage numérique actuel par un compte à rebours plein écran avec animation "pulse + scale" sur chaque chiffre.
- Ajouter un effet sonore "beep" distinct pour 5-4-3 et un "ready-beep" à 1.
- Afficher le message "Souriez 😄" plus tôt (dès le déclenchement API à T-1s) avec une animation de fondu.
- Renforcer le flash final : écran entièrement blanc + vibration du device (si supporté).

## 2. Écran de validation entre chaque photo (mode 4 photos)
- Après chaque capture en mode 4 photos, afficher un écran "Valider / Recommencer" pendant 8s.
- Si l'invité valide, on passe à la photo suivante.
- Si l'invité refuse, on supprime la dernière photo et on reprend la capture.
- Cet écran est optionnel et désactivable dans les paramètres ("Validation rapide entre les photos").

## 3. Révélation de la photo finale plus festive
- Lors de l'affichage du résultat, jouer un son de succès plus long et déclencher une animation de confettis.
- Ajouter un effet "polaroid qui sort de l'appareil" : l'image glisse depuis le haut avec une légère rotation.
- Afficher le texte de l'événement (titre/sous-titre) en filigrane discret sur le résultat.

## 4. Personnalisation visuelle par événement
- Utiliser les couleurs et le style de cadre déjà configurés pour teinter subtilement les écrans d'accueil, compte à rebours et résultat.
- Afficher le monogramme/logo et le titre de l'événement sur l'écran d'accueil de manière plus marquante.
- Ajouter un message d'accueil personnalisable (ex. "Bienvenue au mariage d'Alice & Baptiste").

## 5. Feedback tactile et sonore renforcé
- Vibration courte à chaque appui sur un bouton principal (start, capture, partage).
- Sons différents pour : démarrage, capture, succès, erreur.
- Indicateur visuel quand le backend est lent (spinner "Préparation de l'appareil photo…").

## 6. Écran de remerciement amélioré
- Conserver l'écran de remerciement actuel mais ajouter un compte à rebours visible avant retour à l'accueil.
- Afficher un mini aperçu de la dernière photo prise avec "Votre souvenir est enregistré".

## 7. Partage simplifié
- Sur l'écran résultat, agrandir le QR code et le rendre visible dès l'arrivée (pas besoin d'appuyer sur un bouton).
- Ajouter un bouton "Partager" utilisant l'API Web Share native (si disponible sur Android) pour envoyer directement la photo.

## Fichiers concernés
- `src/components/photobooth/CountdownScreen.tsx`
- `src/components/photobooth/ResultScreen.tsx`
- `src/components/photobooth/WelcomeScreen.tsx`
- `src/components/photobooth/ThanksScreen.tsx`
- `src/components/photobooth/ModeSelection.tsx`
- `src/contexts/SettingsContext.tsx`
- `src/hooks/useSound.ts`
- `src/index.css` (nouvelles animations)

## Non inclus
- Aucune modification backend.
- Aucune modification de la logique d'impression, de la gestion des cadres ou de l'authentification.

## Livrables attendus
- Interface plus festive et rassurante pour les invités.
- Paramètres pour activer/désactiver la validation entre photos et le filigrane événement.
- Sons/vibrations optionnels mais activés par défaut.
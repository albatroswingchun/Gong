功 Gōng — Suivi Arts Martiaux
Application PWA de suivi de progression en arts martiaux.
Structure du projet
gong/
├── index.html        ← Page principale
├── style.css         ← Styles (thème noir/gris + curseurs jaunes)
├── app.js            ← Logique application
├── sw.js             ← Service Worker (mode hors ligne)
├── manifest.json     ← Manifeste PWA
├── icons/
│   ├── icon-192.png  ← Icône PWA
│   └── icon-512.png  ← Icône PWA grande
└── README.md
Déploiement sur GitHub Pages

Créez un repo GitHub (ex: gong)
Copiez tous ces fichiers dans votre repo
Dans Settings → Pages, choisissez la branche main / root
Votre app sera disponible sur https://votre-pseudo.github.io/gong/

Installation sur smartphone (PWA)
Android (Chrome)

Ouvrez l'URL de votre GitHub Pages dans Chrome
Menu ⋮ → Ajouter à l'écran d'accueil

iPhone (Safari)

Ouvrez l'URL dans Safari
Bouton Partager → Sur l'écran d'accueil

Fonctionnalités

Profil — Diagramme radar de 8 qualités + sliders 0→10 avec dégradé gris→jaune
Techniques — Liste de techniques à cocher (maîtrisée / non maîtrisée)
Historique — Journal horodaté de toutes les modifications
Notation — Guide de référence pour noter de 0 à 10
Communauté — Comparaison de diagrammes radar avec d'autres utilisateurs

Comptes
Les comptes sont stockés en local (localStorage).
Pour une vraie synchronisation multi-appareils, connectez un backend (Firebase, Supabase, etc.).
Notes techniques

PWA : installable sans Play Store ni App Store
100% HTML/CSS/JS vanilla, aucune dépendance externe
Fonctionne hors ligne après la première visite

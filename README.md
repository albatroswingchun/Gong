# 功 Gōng — Suivi Arts Martiaux

Application PWA de suivi de progression en arts martiaux.

## Structure du projet

```
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
```

## Déploiement sur GitHub Pages

1. Créez un repo GitHub (ex: `gong`)
2. Copiez tous ces fichiers dans votre repo
3. Dans **Settings → Pages**, choisissez la branche `main` / `root`
4. Votre app sera disponible sur `https://votre-pseudo.github.io/gong/`

## Installation sur smartphone (PWA)

### Android (Chrome)
1. Ouvrez l'URL de votre GitHub Pages dans Chrome
2. Menu ⋮ → **Ajouter à l'écran d'accueil**

### iPhone (Safari)
1. Ouvrez l'URL dans Safari
2. Bouton Partager → **Sur l'écran d'accueil**

## Fonctionnalités

- **Profil** — Diagramme radar de 8 qualités + sliders 0→10 avec dégradé gris→jaune
- **Techniques** — Liste de techniques à cocher (maîtrisée / non maîtrisée)
- **Historique** — Journal horodaté de toutes les modifications
- **Notation** — Guide de référence pour noter de 0 à 10
- **Communauté** — Comparaison de diagrammes radar avec d'autres utilisateurs

## Comptes

Les comptes sont stockés en local (`localStorage`).  
Pour une vraie synchronisation multi-appareils, connectez un backend (Firebase, Supabase, etc.).

## Guide de connexion à Supabase

### 1) Créer le projet Supabase
1. Créez un projet sur https://supabase.com.
2. Récupérez :
   - `Project URL`
   - `anon public key`

### 2) Créer les tables SQL
Dans **SQL Editor**, exécutez :

```sql
create table if not exists gong_users (
  pseudo text primary key,
  skills jsonb not null default '[]'::jsonb,
  techniques jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  observations text not null default '',
  updated_at timestamptz default now()
);
```

### 3) Activer la sécurité (RLS)

```sql
alter table gong_users enable row level security;

-- Exemple simple (dev): autoriser lecture/écriture à tous les utilisateurs anonymes.
-- IMPORTANT: pour la prod, remplacez par des policies strictes basées sur auth.uid().
create policy "gong_users_public_rw"
on gong_users for all
using (true)
with check (true);
```

### 4) Ajouter le client Supabase dans `index.html`
Avant `app.js` :

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 5) Initialiser Supabase dans `app.js`
L'app lit automatiquement ces variables globales :

```js
window.GONG_SUPABASE_URL = 'https://<project-ref>.supabase.co';
window.GONG_SUPABASE_ANON_KEY = '<your-anon-key>';
```

### 6) Comportement déjà branché dans l'app
- Au login local: tentative de chargement distant par `pseudo`.
- À chaque changement: sauvegarde locale + sync distante asynchrone (`upsert`).
- Si Supabase n'est pas configuré: l'app reste 100% locale.

### 7) Sauvegarder/charger l'état utilisateur
- Chargement au login : `select` sur `gong_users`.
- Sauvegarde après modification : `upsert` sur `gong_users`.

Exemple de sauvegarde :

```js
async function saveRemoteState(userId, state) {
  await sb.from('gong_users').upsert({
    pseudo: userId,
    skills: state.skills,
    techniques: state.techniques,
    history: state.history,
    observations: state.observations,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'pseudo' });
}
```

### 8) Stratégie recommandée pour cette app
1. Garder `localStorage` comme cache offline.
2. Au login :
   - récupérer l'état distant ;
   - fusionner avec local si nécessaire ;
   - afficher l'état le plus récent (`updated_at`).
3. À chaque modification : sauvegarde locale immédiate + sync distante asynchrone.
4. En cas d'échec réseau : afficher un toast "Sync en attente".

## Notes techniques

- PWA : installable sans Play Store ni App Store
- 100% HTML/CSS/JS vanilla, aucune dépendance externe
- Fonctionne hors ligne après la première visite

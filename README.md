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
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text unique not null,
  created_at timestamptz default now()
);

create table if not exists user_state (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  skills jsonb not null default '[]'::jsonb,
  techniques jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  observations text not null default '',
  updated_at timestamptz default now(),
  unique(user_id)
);
```

### 3) Activer la sécurité (RLS)

```sql
alter table profiles enable row level security;
alter table user_state enable row level security;

create policy "profiles_select_own"
on profiles for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on profiles for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "state_select_own"
on user_state for select
using (auth.uid() = user_id);

create policy "state_insert_own"
on user_state for insert
with check (auth.uid() = user_id);

create policy "state_update_own"
on user_state for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 4) Ajouter le client Supabase dans `index.html`
Avant `app.js` :

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 5) Initialiser Supabase dans `app.js`
Ajoutez en haut du fichier :

```js
const SUPABASE_URL = 'https://<project-ref>.supabase.co';
const SUPABASE_ANON_KEY = '<your-anon-key>';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 6) Remplacer l'auth locale (progressivement)
- Inscription : `sb.auth.signUp({ email, password })`
- Connexion : `sb.auth.signInWithPassword({ email, password })`
- Déconnexion : `sb.auth.signOut()`
- Session courante : `sb.auth.getSession()`

### 7) Sauvegarder/charger l'état utilisateur
- Chargement au login : lire `user_state` via `select`.
- Sauvegarde après modification : `upsert` sur `user_state`.

Exemple de sauvegarde :

```js
async function saveRemoteState(userId, state) {
  await sb.from('user_state').upsert({
    user_id: userId,
    skills: state.skills,
    techniques: state.techniques,
    history: state.history,
    observations: state.observations,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
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

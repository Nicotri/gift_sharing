# 🎁 Wishlist App

Centralisez vos idées cadeaux, partagez-les avec vos proches et coordonnez-vous discrètement.

## Stack

- **Frontend** — React 18, React Router, CSS Modules
- **Backend** — Supabase (PostgreSQL + Auth + Realtime + RLS)
- **Hébergement** — Vercel

---

## 1. Supabase — Setup

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Dans **SQL Editor**, copiez-collez et exécutez `supabase_migration.sql`
3. Dans **Authentication → Sign In / Providers**, activez **Allow anonymous sign-ins**
4. Récupérez vos clés dans **Project Settings → API** :
   - `Project URL`
   - `anon public key`

---

## 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` :

```
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

---

## 3. Lancer en local

```bash
npm install
npm start
```

L'app tourne sur [http://localhost:3000](http://localhost:3000)

---

## 4. Déployer sur Vercel

```bash
npm install -g vercel
vercel
```

Ajoutez vos variables d'environnement dans le dashboard Vercel :
**Project → Settings → Environment Variables**

---

## Structure du projet

```
src/
├── lib/
│   └── supabase.js          # Client Supabase singleton
├── hooks/
│   ├── useAuth.js           # Auth context (sign-in anonyme, profil)
│   ├── useGroup.js          # CRUD groupe + membres + realtime
│   ├── useWishlist.js       # CRUD cadeaux + vues privées + realtime
│   └── useContributions.js  # Cagnotte + vue publique + realtime
├── components/
│   ├── UI.jsx               # Button, Input, Modal, Toast, Badge…
│   └── UI.module.css
├── pages/
│   ├── Onboarding.jsx       # Écran de bienvenue + création profil
│   ├── Home.jsx             # Créer / rejoindre un groupe
│   ├── Group.jsx            # Liste des membres
│   ├── Wishlist.jsx         # Liste des souhaits + idées secrètes
│   ├── GiftDetail.jsx       # Détail cadeau + cagnotte + révélation
│   └── JoinGroup.jsx        # Deep link /join/:code
├── styles/
│   └── global.css           # Tokens CSS, animations, base
└── App.js                   # Router + AuthGuard
```

---

## Règles de confidentialité (appliquées côté DB via RLS)

| Donnée                            | Propriétaire | Autres membres |
|-----------------------------------|:---:|:---:|
| Ses propres souhaits              | ✅  | ✅  |
| Idées secrètes pour lui           | ❌  | ✅  |
| Statut "réservé" sur ses cadeaux  | ❌  | ✅  |
| Participants à la cagnotte        | ❌  | ✅  |
| Montants individuels              | ❌  | ❌  |
| Tout révélé après "Reçu"          | ✅  | ✅  |

---

## Roadmap v2

- [ ] Notifications push (cadeau réservé, nouvelle idée)
- [ ] Commentaires sur les idées
- [ ] Listes par occasion (Noël, anniversaire…)
- [ ] Suivi de prix automatique
- [ ] Compte permanent (email / Google)

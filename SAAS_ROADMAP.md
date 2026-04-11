# Roadmap SaaS — Get Easy

## Objectif

Transformer le projet Get Easy (location de vehicules, mono-agence) en SaaS multi-agences generique, adaptable au plus grand nombre possible d'agences.

---

## Phase 1 — Multi-tenancy (Fondation)

Tout le reste en depend. Chaque agence ne voit que ses propres donnees.

### Base de donnees
- Ajouter `organization_id` systematique sur toutes les requetes (bookings, vehicles, customers, etc.)
- RLS Supabase active sur toutes les tables avec filtre `organization_id`

### Middleware
- Le middleware identifie l'organisation via le sous-domaine ou un slug dans l'URL
- Chaque admin ne voit que les donnees de son organisation

### Fichiers impactes
- `middleware.ts` — resolution du tenant
- Tous les repositories dans `infrastructure/supabase/repositories/` — ajouter le filtre `organization_id`
- `composition-root/container.ts` — injecter l'`organization_id` dans chaque repository
- `lib/admin/get-admin-session.ts` — le session retourne deja `organizationId`, il faut le propager

---

## Phase 2 — Routing par tenant

### Options
- **Sous-domaines** : `geteasy.votresaas.com`, `autoloc.votresaas.com`
- **Domaines personnalises** : chaque agence a son propre domaine (Vercel Domains API)
- **Slug dans l'URL** : `votresaas.com/geteasy` (le plus simple pour commencer)

### A faire
- Migration SQL : ajouter `slug` unique a la table `organizations`
- Middleware : resoudre le tenant depuis le hostname ou le path
- `next.config.ts` : configurer les rewrites si sous-domaines

---

## Phase 3 — Branding / Theming par agence

### Actuellement hardcode
- Couleurs : noir `#020202`, vert lime `#ccff33`, gris `#59595b`
- Logos : `/logo.svg`, `/logo-white.svg`
- Polices : DM Sans (body), Unbounded (headings)
- Banniere : `/banner.jpg`

### Migration SQL
Ajouter a `organizations` :
```
primary_color, accent_color, logo_url, logo_white_url,
favicon_url, font_heading, font_body, site_title,
site_description, banner_image_url
```

### A faire
- Charger les tokens de theme cote serveur et les injecter via CSS variables dans le layout
- Remplacer les valeurs en dur par des variables CSS
- Les emails doivent aussi utiliser les couleurs du tenant

### Fichiers impactes
- `app/globals.css` — variables CSS dynamiques
- `app/(public)/layout.tsx` — injecter les variables depuis la DB
- `app/admin/(dashboard)/layout.tsx` — sidebar avec logo/couleurs du tenant
- `components/layout/navbar.tsx`, `footer.tsx`, `logo.tsx` — logo dynamique
- `emails/*.tsx` — couleurs dynamiques
- `components/admin/app-sidebar.tsx` — logo dynamique

---

## Phase 4 — Onboarding / Inscription

### Actuellement
Les comptes admin sont crees manuellement dans Supabase.

### A faire
- Page d'inscription publique (`/signup`) : nom de l'agence, email admin, mot de passe
- Creation automatique : `organization` + `agency` + `admin_profile` + compte Supabase Auth
- Wizard d'onboarding apres inscription : infos agence, logo, horaires, premier vehicule
- Email de bienvenue

---

## Phase 5 — Paiements multi-tenant (Stripe Connect)

### Actuellement
Une seule cle Stripe pour Get Easy.

### A faire
- Utiliser **Stripe Connect** : chaque agence a un compte Stripe connecte
- Migration SQL : ajouter `stripe_account_id` a `organizations`
- Onboarding Stripe : lors de l'inscription, l'agence connecte son compte Stripe
- Les paiements sont crees avec `stripeAccount: org.stripeAccountId`
- Le SaaS prend une commission (application fees)

### Fichiers impactes
- `infrastructure/stripe/stripe-payment-gateway.ts` — passer `stripeAccount` dans chaque appel
- `infrastructure/stripe/stripe.client.ts` — ne plus utiliser une seule cle globale
- `app/api/stripe/webhook/route.ts` — verifier le webhook par tenant

---

## Phase 6 — Configuration dynamique

### Actuellement hardcode
- `ADMIN_EMAIL` dans `container.ts` → table `organizations`
- `FROM_ADDRESS` dans `resend-notifier.ts` → `noreply@{domaine-du-tenant}`
- Supabase Storage bucket `rent-saas` → un dossier par tenant : `rent-saas/{org_id}/`
- Metadonnees SEO dans `layout.tsx` → depuis la DB
- `robots.ts` / `sitemap.ts` → dynamiques par tenant
- Texte du footer "Get Easy" → depuis la DB

### Emails
- Passer le nom de l'agence, le logo, les couleurs aux templates d'email
- `FROM_ADDRESS` dynamique par tenant
- Ajouter un champ `reply_to` dans les parametres agence

---

## Phase 7 — Facturation SaaS (Abonnements)

### A faire
- Table `subscriptions` (plan, status, stripe_subscription_id, trial_ends_at)
- Plans : Free (limite), Pro, Enterprise
- Middleware : verifier que l'abonnement est actif avant d'afficher le site public
- Page `/admin/abonnement` pour gerer le plan
- Stripe Billing pour les abonnements recurrents

---

## Phase 8 — Internationalisation (i18n) et Timezone

### Actuellement
- Tout en francais
- Timezone hardcodee `America/Cayenne`

### A faire (optionnel pour commencer)
- Ajouter `locale` / `timezone` a `organizations`
- `formatDateCayenne` → `formatDateTenant` avec timezone dynamique
- Traduire les labels si besoin (next-intl ou i18next)

---

## Phase 9 — Isolation et securite des donnees

### A faire
- RLS sur **toutes** les tables avec `organization_id`
- Les repositories ne doivent jamais oublier le filtre
- Supabase Storage : policies par organisation
- Tests automatises pour verifier qu'un tenant ne peut pas acceder aux donnees d'un autre

---

## Resume des priorites

| Phase | Tache | Effort | Priorite |
|-------|-------|--------|----------|
| 1 | Multi-tenancy (org_id + RLS) | Important | Critique |
| 2 | Routing par slug/sous-domaine | Moyen | Haute |
| 3 | Branding dynamique (CSS + logo) | Moyen | Haute |
| 4 | Onboarding (inscription + wizard) | Important | Haute |
| 5 | Stripe Connect (paiements multi-tenant) | Important | Haute |
| 6 | Configuration dynamique (emails, SEO) | Moyen | Moyenne |
| 7 | Facturation SaaS (abonnements) | Important | Moyenne |
| 8 | i18n / timezone | Leger | Basse |
| 9 | Isolation et securite | Important | Critique |

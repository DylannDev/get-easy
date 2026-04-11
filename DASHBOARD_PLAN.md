# Plan : Dashboard Admin Get Easy

## Contexte

L'agence Get Easy (location de vehicules en Guyane) a besoin d'un dashboard admin pour gerer ses reservations, clients, vehicules et statistiques. Le dashboard est inspire de captures d'ecran d'un concurrent mais avec un design propre a Get Easy (noir, vert lime, gris). Les fonctionnalites seront developpees une par une avec validation utilisateur entre chaque etape.

---

## Phase 1 — Fondation (Auth + Layout)

### 1A. Authentification Supabase
Login email/mot de passe pour l'admin. Pas de signup (comptes crees manuellement dans Supabase).

**Migration SQL** : table `admin_profiles` (id -> auth.users, organization_id, role)

**Fichiers a creer** :
- `infrastructure/supabase/auth.ts` — client Supabase SSR pour auth (browser + server)
- `middleware.ts` — protege `/admin/*`, redirige vers `/admin/login` si pas de session
- `app/admin/login/page.tsx` — page de login (server component)
- `components/admin/login-form.tsx` — formulaire email + mdp (client component)
- `actions/admin/auth.ts` — server action `signOut()`
- `lib/admin/get-admin-session.ts` — verification session + admin_profiles

### 1B. Layout Dashboard (Sidebar + Shell)
**Installer** : `npx shadcn@latest add sidebar skeleton separator dropdown-menu badge table tooltip sheet`

**Fichiers a creer** :
- `app/admin/layout.tsx` — layout admin (SidebarProvider, pas de Navbar/Footer client)
- `components/admin/app-sidebar.tsx` — sidebar noir avec navigation en francais
- `components/admin/admin-header.tsx` — barre superieure (breadcrumb, SidebarTrigger mobile)
- `components/admin/page-header.tsx` — composant reutilisable titre + bouton action

**Navigation sidebar** : Tableau de bord, Reservations, Planning, Clients, Vehicules, Indisponibilites, Statistiques, Tarifs, Parametres

**CSS** : variables sidebar dans `globals.css` (--sidebar: #020202, --sidebar-primary: #ccff33)

---

## Phase 2 — Business Core

### 2A. Tableau de bord (`/admin`)
3 cartes resumees : departs/retours du jour, locations en cours, demandes en attente. + Table des 10 reservations recentes.

**Fichiers** :
- `domain/booking/booking-with-details.ts` — type etendu avec infos client/vehicule
- `application/admin/get-dashboard-summary.use-case.ts`
- `app/admin/page.tsx`
- `components/admin/dashboard/summary-cards.tsx`
- `components/admin/dashboard/recent-bookings-table.tsx`
- `components/admin/shared/booking-status-badge.tsx` — badges colores par statut

**Repo** : ajouter `findTodaysDepartures`, `findTodaysReturns`, `countByStatus` a BookingRepository

### 2B. Liste des reservations (`/admin/reservations`)
Table paginee avec filtres (statut, dates, recherche), tri, badges statut. Page detail au clic.

**Fichiers** :
- `application/admin/list-bookings.use-case.ts`
- `app/admin/reservations/page.tsx`
- `components/admin/reservations/reservations-table.tsx`
- `components/admin/reservations/reservations-filters.tsx`
- `components/admin/shared/data-table.tsx` — table generique reutilisable
- `components/admin/shared/pagination.tsx`
- `app/admin/reservations/[bookingId]/page.tsx` — detail reservation

**Repo** : ajouter `findAllWithDetails` (join customers+vehicles, pagination, filtres)

### 2C. Planning / Calendrier (`/admin/planning`)
Vue Gantt : vehicules en Y, jours en X, barres colorees par statut.

**Librairie** : `react-modern-gantt` (install via pnpm)

**Fichiers** :
- `application/admin/get-planning-data.use-case.ts`
- `app/admin/planning/page.tsx`
- `components/admin/planning/planning-view.tsx` — orchestrateur (navigation semaine/mois)
- `components/admin/planning/planning-grid.tsx` — wrapper react-modern-gantt
- `components/admin/planning/planning-header.tsx` — en-tete dates + filtres

---

## Phase 3 — Gestion

### 3A. Clients (`/admin/clients`)
Table avec recherche, pagination. Page detail avec formulaire d'edition + historique reservations.

**Fichiers** :
- `application/admin/list-customers.use-case.ts`
- `app/admin/clients/page.tsx`
- `app/admin/clients/[customerId]/page.tsx`
- `components/admin/clients/clients-table.tsx`
- `components/admin/clients/customer-form.tsx`
- `components/admin/clients/customer-bookings.tsx`

### 3B. Vehicules (`/admin/vehicules`)
Grille de cartes avec photo, infos, badges. CRUD complet + upload image via Supabase Storage.

**Fichiers** :
- `application/admin/manage-vehicle.use-case.ts`
- `app/admin/vehicules/page.tsx`
- `app/admin/vehicules/[vehicleId]/page.tsx`
- `app/admin/vehicules/nouveau/page.tsx`
- `components/admin/vehicles/vehicle-grid.tsx`
- `components/admin/vehicles/vehicle-card-admin.tsx`
- `components/admin/vehicles/vehicle-form.tsx`
- `actions/admin/vehicles.ts`

### 3C. Indisponibilites (`/admin/indisponibilites`)
Table avec vehicule, dates, commentaire. Dialog pour creer/editer. Boutons supprimer.

**Fichiers** :
- `app/admin/indisponibilites/page.tsx`
- `components/admin/blocked-periods/blocked-periods-table.tsx`
- `components/admin/blocked-periods/blocked-period-dialog.tsx`
- `actions/admin/blocked-periods.ts`

---

## Phase 4 — Statistiques (`/admin/statistiques`)
KPIs : nb reservations, prix moyen, CA cumule, duree moyenne, nb indispos. Graphiques donut par vehicule.

**Dependance** : `recharts`

**Fichiers** :
- `application/admin/get-statistics.use-case.ts`
- `app/admin/statistiques/page.tsx`
- `components/admin/statistics/kpi-cards.tsx`
- `components/admin/statistics/charts-section.tsx`
- `components/admin/statistics/statistics-filters.tsx`

---

## Phase 5 — Fonctionnalites avancees

### 5A. Reservation manuelle (`/admin/reservations/nouvelle`)
Wizard 3 etapes : dates -> vehicule + client -> confirmation. Cree un booking `paid` directement.

### 5B. Tarifs degressifs (`/admin/tarifs`)
Edition par vehicule des paliers (min_days + prix/jour). Ajout/suppression de lignes.

### 5C. Parametres agence (`/admin/parametres`)
Edition infos agence : nom, adresse, horaires.

---

## Phase 6 — Futur (priorite basse)
- Gestion des documents (factures, contrats) — necessite table `documents` + Supabase Storage
- Gestion des options (conducteur supplementaire, etc.) — necessite table `options`
- Editeur conditions de location — necessite editeur rich text (tiptap)

---

## Decisions techniques
1. **Pagination server-side** : filtres dans URL searchParams, server components fetch uniquement la page requise
2. **Planning avec react-modern-gantt** : librairie React dediee aux vues Gantt
3. **Admin utilise `createAdminClient()`** (service role) : middleware gere l'auth, pas de RLS cote admin
4. **Extension incrementale du container** : chaque phase ajoute ses use cases
5. **Reutilisation services existants** : availability service, pricing service
6. **Tout en francais** : labels, messages d'erreur, UI

## Verification
- Phase 1 : login fonctionnel, sidebar navigable, redirection si non-connecte
- Phase 2 : donnees reelles affichees, filtres et pagination operationnels, planning visuel correct
- Phase 3 : CRUD clients/vehicules/indispos fonctionnel
- Phase 4 : KPIs calcules correctement, graphiques coherents
- Phase 5 : reservation manuelle cree un booking en base, tarifs modifiables

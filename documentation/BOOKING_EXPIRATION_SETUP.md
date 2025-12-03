# Configuration du système d'expiration automatique des réservations

Ce document explique comment configurer le système d'expiration automatique des réservations `pending_payment` pour empêcher les doubles réservations et libérer automatiquement les dates.

## 🎯 Objectif

Le système garantit que :
- Les réservations `pending_payment` bloquent temporairement les dates (10 minutes)
- Les dates sont automatiquement libérées si le paiement n'est jamais effectué
- Les doubles réservations sont impossibles
- Le calendrier reste toujours propre

## 📋 Prérequis

- Accès au Dashboard Supabase de votre projet
- Supabase CLI installé localement (pour déployer la Edge Function)

## 🔧 Étapes d'installation

### 1. Appliquer la migration SQL

Exécutez la migration SQL pour ajouter le champ `expires_at` à la table `bookings` :

```bash
# Via Supabase SQL Editor (Dashboard)
```

Allez dans **Database → SQL Editor** et exécutez le contenu du fichier :
[lib/supabase/migrations/add_expires_at_to_bookings.sql](lib/supabase/migrations/add_expires_at_to_bookings.sql)

Ou via CLI :

```bash
supabase db push
```

### 2. Déployer la Edge Function

Déployez la fonction Edge qui expire automatiquement les réservations :

```bash
# Connectez-vous à votre projet Supabase
supabase login

# Liez votre projet local
supabase link --project-ref VOTRE_PROJECT_REF

# Déployez la fonction expire-bookings
supabase functions deploy expire-bookings
```

Vous pouvez tester manuellement la fonction :

```bash
# Test local
supabase functions serve expire-bookings

# Test production
curl -X POST 'https://VOTRE_PROJECT_REF.supabase.co/functions/v1/expire-bookings' \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 3. Configurer le Cron Job Supabase

1. Allez dans le **Dashboard Supabase** → **Database** → **Cron Jobs** (ou via l'extension pg_cron)

2. Créez un nouveau Cron Job avec cette configuration :

```sql
-- Active l'extension pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crée le cron job pour appeler la fonction toutes les 5 minutes
SELECT cron.schedule(
  'expire-pending-bookings',           -- nom du job
  '*/5 * * * *',                       -- toutes les 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://VOTRE_PROJECT_REF.supabase.co/functions/v1/expire-bookings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer VOTRE_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    );
  $$
);
```

**⚠️ IMPORTANT** : Remplacez :
- `VOTRE_PROJECT_REF` par votre référence de projet Supabase
- `VOTRE_SERVICE_ROLE_KEY` par votre clé service role (disponible dans Settings → API)

### 4. Vérifier que tout fonctionne

#### Vérifier la migration

```sql
-- Vérifiez que la colonne expires_at existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'expires_at';
```

#### Vérifier le Cron Job

```sql
-- Listez tous les cron jobs
SELECT * FROM cron.job;

-- Vérifiez les exécutions récentes
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-pending-bookings')
ORDER BY start_time DESC
LIMIT 10;
```

#### Tester manuellement l'expiration

```sql
-- 1. Créez une réservation test expirée
INSERT INTO bookings (customer_id, vehicle_id, agency_id, start_date, end_date, total_price, status, expires_at)
VALUES (
  'CUSTOMER_ID',
  'VEHICLE_ID',
  'AGENCY_ID',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '2 days',
  100.00,
  'pending_payment',
  NOW() - INTERVAL '1 minute'  -- Déjà expirée
);

-- 2. Appelez manuellement la fonction Edge
-- (via curl ou via le Dashboard)

-- 3. Vérifiez que le statut a changé
SELECT id, status, expires_at
FROM bookings
WHERE status = 'expired'
ORDER BY created_at DESC
LIMIT 5;
```

## 🔍 Monitoring

### Voir les réservations qui vont expirer bientôt

```sql
SELECT id, customer_id, vehicle_id, status, expires_at,
       expires_at - NOW() as time_until_expiration
FROM bookings
WHERE status = 'pending_payment'
  AND expires_at IS NOT NULL
  AND expires_at > NOW()
ORDER BY expires_at ASC;
```

### Voir les réservations expirées récemment

```sql
SELECT id, customer_id, vehicle_id, status, expires_at, created_at
FROM bookings
WHERE status = 'expired'
ORDER BY expires_at DESC
LIMIT 20;
```

### Statistiques d'expiration

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'pending_payment' AND expires_at > NOW()) as pending_valid,
  COUNT(*) FILTER (WHERE status = 'expired') as total_expired,
  COUNT(*) FILTER (WHERE status = 'paid') as total_paid
FROM bookings;
```

## 📝 Configuration

### Modifier le délai d'expiration

Le délai par défaut est de **10 minutes**. Pour le modifier :

Éditez [actions/create-booking.ts](actions/create-booking.ts) ligne 110 :

```typescript
// Modifier 10 par le nombre de minutes souhaité
const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
```

### Modifier la fréquence du Cron

Le Cron s'exécute toutes les **5 minutes** par défaut. Pour modifier :

```sql
-- Format cron : minute heure jour mois jour_semaine
-- Exemples :
'*/1 * * * *'     -- Toutes les 1 minute
'*/5 * * * *'     -- Toutes les 5 minutes (défaut)
'*/10 * * * *'    -- Toutes les 10 minutes
'0 * * * *'       -- Toutes les heures
```

## 🚨 Dépannage

### Le Cron ne s'exécute pas

1. Vérifiez que `pg_cron` est activé :
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Vérifiez les logs d'erreur :
```sql
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### La Edge Function échoue

1. Vérifiez les logs dans le Dashboard Supabase → Edge Functions → expire-bookings → Logs

2. Testez la fonction manuellement pour voir l'erreur :
```bash
curl -X POST 'https://VOTRE_PROJECT_REF.supabase.co/functions/v1/expire-bookings' \
  -H "Authorization: Bearer VOTRE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Les réservations ne s'expirent pas

1. Vérifiez que `expires_at` est bien défini lors de la création :
```sql
SELECT id, status, expires_at, created_at
FROM bookings
WHERE status = 'pending_payment'
ORDER BY created_at DESC
LIMIT 5;
```

2. Vérifiez que le Cron s'exécute bien :
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-pending-bookings')
ORDER BY start_time DESC
LIMIT 5;
```

## ✅ Checklist de déploiement

- [ ] Migration SQL appliquée (`expires_at` existe dans la table `bookings`)
- [ ] Edge Function `expire-bookings` déployée
- [ ] Cron Job configuré dans Supabase
- [ ] Test manuel de la fonction réussi
- [ ] Vérification que les réservations expirent automatiquement
- [ ] Monitoring en place

## 🔗 Fichiers liés

- [lib/supabase/migrations/add_expires_at_to_bookings.sql](lib/supabase/migrations/add_expires_at_to_bookings.sql) - Migration SQL
- [supabase/functions/expire-bookings/index.ts](supabase/functions/expire-bookings/index.ts) - Edge Function
- [actions/create-booking.ts](actions/create-booking.ts) - Création de réservation avec expires_at
- [lib/availability.ts](lib/availability.ts) - Logique de disponibilité mise à jour
- [lib/utils.ts](lib/utils.ts) - Fonction utilitaire `isBookingStillValid()`

## 📚 Ressources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

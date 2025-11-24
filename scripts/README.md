# Script de Seed Supabase

Ce script permet d'insérer les données mockées de `data/vehicles.ts` dans votre base de données Supabase.

## Prérequis

1. **Configuration Supabase** : Assurez-vous d'avoir créé les tables suivantes dans Supabase :

### Structure des tables

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agencies
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  interval INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT NOT NULL,
  price_per_day NUMERIC NOT NULL,
  transmission TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  number_of_seats INTEGER NOT NULL,
  number_of_doors INTEGER NOT NULL,
  trunk_size TEXT NOT NULL,
  year INTEGER NOT NULL,
  registration_plate TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  img TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked Periods
CREATE TABLE blocked_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start TIMESTAMP WITH TIME ZONE NOT NULL,
  end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing Tiers
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  min_days INTEGER NOT NULL,
  price_per_day NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_agencies_organization_id ON agencies(organization_id);
CREATE INDEX idx_vehicles_agency_id ON vehicles(agency_id);
CREATE INDEX idx_blocked_periods_vehicle_id ON blocked_periods(vehicle_id);
CREATE INDEX idx_pricing_tiers_vehicle_id ON pricing_tiers(vehicle_id);
```

2. **Variables d'environnement** : Créez un fichier `.env.local` avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **Important** : La `SUPABASE_SERVICE_ROLE_KEY` ne doit **JAMAIS** être exposée côté client. Elle est uniquement utilisée pour le seed.

## Utilisation

### Exécuter le seed

```bash
pnpm seed
```

### Ce que fait le script

1. **Nettoie la base de données** : Supprime toutes les données existantes dans l'ordre inverse des dépendances
2. **Insère les organisations** : Depuis `data/vehicles.ts`
3. **Insère les agences** : Pour chaque organisation
4. **Insère les véhicules** : Pour chaque agence
5. **Insère les périodes bloquées** : Pour chaque véhicule
6. **Insère les paliers tarifaires** : Pour chaque véhicule

### Sortie attendue

```
🌱 Démarrage du seed...

🧹 Nettoyage de la base de données...
  ✅ pricing_tiers nettoyé
  ✅ blocked_periods nettoyé
  ✅ vehicles nettoyé
  ✅ agencies nettoyé
  ✅ organizations nettoyé
✅ Base de données nettoyée avec succès

📦 Insertion de l'organisation: Get Easy
  ✅ Organisation insérée: Get Easy (get-easy)
  📍 Insertion de l'agence: Get Easy - Remire Montjoly
    ✅ Agence insérée: Get Easy (remire-montjoly)
    🚗 Insertion du véhicule: Renault Clio (FZ-123-AB)
      ✅ Véhicule inséré: Renault Clio
      🚫 Insertion de 2 période(s) bloquée(s)
        ✅ 2 période(s) bloquée(s) insérée(s)
      💰 Insertion de 4 palier(s) tarifaire(s)
        ✅ 4 palier(s) tarifaire(s) inséré(s)
    ...

✅ Seed terminé avec succès!

📊 Résumé:
  - 1 organisation(s)
  - 1 agence(s)
  - 3 véhicule(s)
```

## Dépannage

### Erreur : Missing environment variables

Vérifiez que votre fichier `.env.local` contient toutes les variables nécessaires.

### Erreur : relation "organizations" does not exist

Les tables n'ont pas été créées dans Supabase. Exécutez les requêtes SQL ci-dessus dans le SQL Editor de Supabase.

### Erreur : Permission denied

Assurez-vous d'utiliser la `SUPABASE_SERVICE_ROLE_KEY` et non la clé anonyme.

## Notes importantes

- Le script **supprime toutes les données existantes** avant d'insérer les nouvelles
- Les IDs des entités sont préservés depuis les données mockées pour maintenir la cohérence
- Les timestamps sont automatiquement gérés par Supabase avec `DEFAULT NOW()`
- Le script utilise la service role key pour bypass les Row Level Security (RLS) policies

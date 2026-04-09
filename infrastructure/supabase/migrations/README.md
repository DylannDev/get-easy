# Migrations Supabase

## Comment exécuter les migrations

### Méthode 1 : Via le SQL Editor de Supabase (Recommandé)

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu de `create_customers_and_bookings.sql`
5. Exécutez la requête

### Méthode 2 : Via la CLI Supabase

Si vous avez installé la CLI Supabase :

```bash
supabase db push
```

## Fichiers de migration

- `create_customers_and_bookings.sql` : Crée les tables `customers` et `bookings` avec leurs politiques RLS

## Tables créées

### customers
Table pour stocker les informations des clients :
- Informations personnelles (nom, prénom, email, téléphone)
- Date et lieu de naissance
- Adresse de facturation
- Informations du permis de conduire
- Lien optionnel avec un compte utilisateur (user_id)

### bookings
Table pour stocker les réservations :
- Référence au client (customer_id)
- Référence au véhicule (vehicle_id)
- Référence à l'agence (agency_id)
- Dates de début et fin de location
- Prix total
- Statut de la réservation (pending, confirmed, cancelled, etc.)

## Politiques RLS

Les politiques de sécurité Row Level Security sont configurées pour :
- Permettre à tout le monde de créer un client/réservation (pour les nouveaux bookings)
- Permettre aux utilisateurs authentifiés de voir uniquement leurs propres données
- Permettre aux utilisateurs authentifiés de modifier uniquement leurs propres données

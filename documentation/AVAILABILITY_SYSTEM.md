# Système de disponibilité des véhicules

## 📋 Vue d'ensemble

Le système de disponibilité prend maintenant en compte **deux sources** pour déterminer si un véhicule est disponible :

1. **`blocked_periods`** : Périodes bloquées manuellement (maintenance, etc.)
2. **`bookings`** : Réservations existantes avec statut actif

## 🏗️ Architecture

### Fichiers créés

#### 1. [lib/availability.ts](lib/availability.ts)

Contient les fonctions de vérification de disponibilité :

- **`isVehicleAvailableWithBookings()`** : Vérifie si un véhicule est disponible
- **`getBlockedDatesForVehicle()`** : Retourne toutes les dates bloquées

#### 2. [actions/get-vehicle-bookings.ts](actions/get-vehicle-bookings.ts)

Server Actions pour récupérer les bookings :

- **`getVehicleBookings(vehicleId)`** : Récupère les bookings d'un véhicule
- **`getMultipleVehiclesBookings(vehicleIds)`** : Récupère les bookings de plusieurs véhicules

## 🔧 Utilisation

### Cas d'usage 1 : Vérifier la disponibilité d'un véhicule

```typescript
import { getVehicleBookings } from "@/actions/get-vehicle-bookings";
import { isVehicleAvailableWithBookings } from "@/lib/availability";

// 1. Récupérer les bookings
const bookings = await getVehicleBookings(vehicle.id);

// 2. Vérifier la disponibilité
const isAvailable = isVehicleAvailableWithBookings(
  vehicle,
  startDate,
  endDate,
  bookings
);
```

### Cas d'usage 2 : Obtenir les dates bloquées pour un calendrier

```typescript
import { getVehicleBookings } from "@/actions/get-vehicle-bookings";
import { getBlockedDatesForVehicle } from "@/lib/availability";

// 1. Récupérer les bookings
const bookings = await getVehicleBookings(vehicle.id);

// 2. Obtenir toutes les dates bloquées
const blockedDates = getBlockedDatesForVehicle(vehicle, bookings);

// 3. Utiliser dans un DatePicker
<DatePicker
  disabledDates={(date) =>
    blockedDates.some(
      (blocked) => blocked.getTime() === date.getTime()
    )
  }
/>
```

### Cas d'usage 3 : Filtrer les véhicules disponibles

```typescript
import { getMultipleVehiclesBookings } from "@/actions/get-vehicle-bookings";
import { isVehicleAvailableWithBookings } from "@/lib/availability";

// 1. Récupérer tous les bookings
const vehicleIds = vehicles.map((v) => v.id);
const bookingsMap = await getMultipleVehiclesBookings(vehicleIds);

// 2. Filtrer les véhicules disponibles
const availableVehicles = vehicles.filter((vehicle) => {
  const bookings = bookingsMap.get(vehicle.id) || [];
  return isVehicleAvailableWithBookings(
    vehicle,
    startDate,
    endDate,
    bookings
  );
});
```

## 📊 Statuts de réservation pris en compte

Les statuts suivants sont considérés comme **bloquants** :

- `pending_payment` : Réservation créée, en attente de paiement
- `paid` : Réservation payée et confirmée

Les statuts suivants sont **ignorés** (n'affectent pas la disponibilité) :

- `payment_failed` : Paiement échoué
- `refunded` : Réservation remboursée
- `cancelled` : Réservation annulée (si ajouté dans le futur)

## 🔄 Logique de chevauchement

Deux périodes se chevauchent si :

```typescript
requestedStart <= periodEnd && requestedEnd >= periodStart
```

Exemples :

```
Période bloquée : |===|
Demandée :              |===|  → ✅ Disponible (pas de chevauchement)

Période bloquée : |===|
Demandée :          |===|      → ❌ Indisponible (chevauchement)

Période bloquée :   |===|
Demandée :        |=======|    → ❌ Indisponible (chevauchement)
```

## ⚙️ Migration des composants existants

### Hook `useSearchForm`

Actuellement utilise `isVehicleAvailable()` qui ne prend en compte que `blockedPeriods`.

**À faire** :
1. Récupérer les bookings avec `getMultipleVehiclesBookings()`
2. Remplacer `isVehicleAvailable()` par `isVehicleAvailableWithBookings()`

### Hook `useBookingSummary`

Actuellement utilise `isDateBlocked()` qui ne prend en compte que `blockedPeriods`.

**À faire** :
1. Récupérer les bookings avec `getVehicleBookings()`
2. Utiliser `getBlockedDatesForVehicle()` pour obtenir toutes les dates bloquées

## 🚀 Exemple d'intégration dans `useSearchForm`

```typescript
export const useSearchForm = (agencies: Agency[]) => {
  const [bookingsMap, setBookingsMap] = useState<Map<string, VehicleBooking[]>>(
    new Map()
  );

  // Récupérer les bookings au chargement
  useEffect(() => {
    const fetchBookings = async () => {
      const allVehicles = agencies.flatMap((agency) => agency.vehicles);
      const vehicleIds = allVehicles.map((v) => v.id);
      const bookings = await getMultipleVehiclesBookings(vehicleIds);
      setBookingsMap(bookings);
    };

    fetchBookings();
  }, [agencies]);

  // Filtrer les véhicules disponibles
  const available = agency.vehicles.filter((vehicle) => {
    const bookings = bookingsMap.get(vehicle.id) || [];
    return isVehicleAvailableWithBookings(
      vehicle,
      startDateTime,
      endDateTime,
      bookings
    );
  });
};
```

## 🧪 Tests recommandés

### Test 1 : Blocked Period uniquement
```
Période bloquée : 10/01 → 15/01
Demandée :       05/01 → 12/01
Résultat :       ❌ Indisponible
```

### Test 2 : Booking uniquement
```
Booking actif :  10/01 → 15/01 (status: paid)
Demandée :       05/01 → 12/01
Résultat :       ❌ Indisponible
```

### Test 3 : Booking annulé
```
Booking annulé : 10/01 → 15/01 (status: payment_failed)
Demandée :       05/01 → 12/01
Résultat :       ✅ Disponible
```

### Test 4 : Combinaison
```
Blocked Period : 10/01 → 12/01
Booking actif :  15/01 → 20/01
Demandée :       05/01 → 09/01
Résultat :       ✅ Disponible
```

## 📝 Notes importantes

1. **Normalisation des dates** : Toutes les dates sont normalisées à minuit (00:00:00) pour éviter les problèmes de comparaison d'heures

2. **Performance** : Utiliser `getMultipleVehiclesBookings()` pour récupérer les bookings de plusieurs véhicules en une seule requête

3. **Cache** : Considérer l'ajout d'un cache pour les bookings si la liste de véhicules est grande

4. **Temps réel** : Les bookings sont récupérés à chaque recherche. Pour une mise à jour en temps réel, utiliser Supabase Realtime (optionnel)

## 🎯 Prochaines étapes

- [ ] Migrer `useSearchForm` pour utiliser le nouveau système
- [ ] Migrer `useBookingSummary` pour utiliser le nouveau système
- [ ] Ajouter un cache pour les bookings
- [ ] (Optionnel) Implémenter Supabase Realtime pour les mises à jour en temps réel
- [ ] Ajouter des tests unitaires pour `isVehicleAvailableWithBookings()`

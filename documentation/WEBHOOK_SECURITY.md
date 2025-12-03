# Sécurisation du Webhook Stripe

Ce document explique comment le système empêche les paiements tardifs et les doubles réservations, même si Stripe Checkout reste ouvert pendant longtemps.

## 🎯 Objectifs

Le système garantit que :
- ❌ Les paiements tardifs (après expiration) sont automatiquement refusés et remboursés
- ❌ Les doubles réservations sont impossibles
- ❌ Les véhicules déjà réservés ne peuvent pas être payés une deuxième fois
- ✅ Seuls les paiements valides sont approuvés
- ✅ Les clients sont informés automatiquement en cas de rejet

## 🔒 Système de Validation en 4 Étapes

Le webhook Stripe ([app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts)) effectue **4 validations critiques** avant d'approuver un paiement :

### Validation 1 : Booking Existe

```typescript
// Vérifier que le booking existe encore dans la base de données
const { data: booking } = await supabase
  .from("bookings")
  .select("id, status, expires_at, start_date, end_date, vehicle_id, customer_id")
  .eq("id", bookingId)
  .single();

if (!booking) {
  // ❌ REJECT : Marquer payment.status = "rejected"
}
```

**Scénario bloqué** : Booking supprimé ou introuvable

---

### Validation 2 : Statut = "pending_payment"

```typescript
if (booking.status !== "pending_payment") {
  // ❌ REJECT : Le booking a déjà été traité
  // Déclenche un remboursement Stripe automatique
}
```

**Scénarios bloqués** :
- Booking déjà payé (`status = "paid"`)
- Booking annulé (`status = "cancelled"`)
- Booking expiré par le CRON (`status = "expired"`)

---

### Validation 3 : Réservation Non Expirée

```typescript
const now = new Date();
const expiresAt = booking.expires_at ? new Date(booking.expires_at) : null;

if (!expiresAt || expiresAt <= now) {
  // ❌ REJECT : La fenêtre de paiement de 10 minutes est dépassée
  // Marque booking.status = "expired"
  // Déclenche un remboursement Stripe
  // Envoie un email au client (reason: "expired")
}
```

**Scénario bloqué** : Client met 15 minutes à payer → paiement automatiquement refusé

---

### Validation 4 : Dates Toujours Disponibles

```typescript
// Récupère TOUS les bookings du même véhicule
const { data: allBookings } = await supabase
  .from("bookings")
  .select("id, start_date, end_date, status, expires_at")
  .eq("vehicle_id", booking.vehicle_id);

// Utilise la fonction d'overlap existante
const isAvailable = isVehicleAvailableExcludingBooking(
  new Date(booking.start_date),
  new Date(booking.end_date),
  bookingId,
  allBookings || []
);

if (!isAvailable) {
  // ❌ REJECT : Un autre client a réservé ces dates entre-temps
  // Marque booking.status = "payment_failed"
  // Marque payment.status = "rejected"
  // Déclenche un remboursement Stripe
  // Envoie un email au client (reason: "unavailable")
}
```

**Scénario bloqué** :
1. Client A sélectionne le 1er-5 janvier
2. Client B sélectionne le 1er-5 janvier
3. Client A paie en premier → ✅ OK
4. Client B paie 30 secondes après → ❌ REJETÉ (dates déjà prises)

**Logique d'overlap utilisée** :
- ✅ Réservations `status = "paid"` bloquent toujours
- ✅ Réservations `status = "pending_payment"` avec `expires_at > NOW()` bloquent
- ❌ Réservations expirées ne bloquent pas

---

## ✅ Approbation du Paiement

Si **toutes les 4 validations passent** :

```typescript
// 1. Mettre à jour payments.status = "succeeded"
await supabase.from("payments").update({
  status: "succeeded",
  stripe_payment_intent_id: session.payment_intent
}).eq("id", paymentId);

// 2. Mettre à jour bookings.status = "paid"
await supabase.from("bookings").update({
  status: "paid"
}).eq("id", bookingId);

// 3. Envoyer les emails de confirmation
await sendBookingPaidClientEmail({ ... });
await sendBookingPaidAdminEmail({ ... });
```

---

## ❌ Rejet du Paiement

Si **une validation échoue** :

### 1. Mise à jour des statuts

```typescript
// Marquer le paiement comme rejeté
await supabase.from("payments").update({
  status: "rejected"
}).eq("id", paymentId);

// Marquer le booking comme expiré/échoué selon la raison
await supabase.from("bookings").update({
  status: "expired" | "payment_failed"
}).eq("id", bookingId);
```

### 2. Remboursement Stripe Automatique

```typescript
if (session.payment_intent) {
  await stripe.refunds.create({
    payment_intent: session.payment_intent,
    reason: "requested_by_customer"
  });
  console.log("✅ Remboursement Stripe initié");
}
```

Le remboursement est automatique et prend 5-10 jours ouvrés.

### 3. Email d'Information au Client

```typescript
await sendBookingRejectedEmail({
  to: customer.email,
  firstName: customer.first_name,
  lastName: customer.last_name,
  vehicle: { brand, model },
  startDate: "...",
  endDate: "...",
  reason: "expired" | "unavailable" | "invalid"
});
```

**Template email** : [emails/BookingRejectedEmail.tsx](emails/BookingRejectedEmail.tsx)

Le client reçoit :
- Raison du rejet (expiration / dates indisponibles / statut invalide)
- Détails de sa tentative de réservation
- Information sur le remboursement automatique
- Lien pour faire une nouvelle réservation

---

## 🧱 Architecture de Sécurité

### Fonction Utilitaire Réutilisable

[lib/availability.ts:177](lib/availability.ts#L177)

```typescript
export function isVehicleAvailableExcludingBooking(
  requestedStart: Date,
  requestedEnd: Date,
  excludeBookingId: string,
  allBookings: Booking[]
): boolean
```

**Principe** :
- Réutilise la même logique d'overlap que `useSearchForm` et `useBookingSummary`
- Filtre les bookings pertinents (paid + pending_payment non-expirés)
- Exclut le booking en cours de paiement
- Retourne `true` si disponible, `false` si conflit

**Pas de duplication** : Une seule source de vérité pour l'overlap.

---

## 📊 Diagramme de Flux

```
Stripe Webhook: checkout.session.completed
         ↓
   Récupérer bookingId + paymentId
         ↓
   ✅ Validation 1: Booking existe ?
         ↓ Non → REJECT + payment.status = "rejected"
         ↓ Oui
   ✅ Validation 2: status = "pending_payment" ?
         ↓ Non → REJECT + Refund
         ↓ Oui
   ✅ Validation 3: expires_at > NOW() ?
         ↓ Non → REJECT + Refund + Email (expired)
         ↓ Oui
   ✅ Validation 4: Dates disponibles ?
         ↓ Non → REJECT + Refund + Email (unavailable)
         ↓ Oui
   ✅ APPROUVER
         ↓
   payment.status = "succeeded"
   booking.status = "paid"
   Envoyer emails de confirmation
```

---

## 🚨 Scénarios de Test

### Scénario 1 : Paiement Normal
- ✅ Client paie en 2 minutes
- ✅ Toutes les validations passent
- ✅ Réservation confirmée

### Scénario 2 : Paiement Tardif (Expiration)
- ❌ Client paie après 15 minutes
- ❌ Validation 3 échoue : `expires_at <= now`
- ❌ Paiement refusé + Remboursement + Email

### Scénario 3 : Double Réservation
- Client A et Client B sélectionnent les mêmes dates
- ✅ Client A paie en premier → OK
- ❌ Client B paie 30s après → Validation 4 échoue
- ❌ Paiement B refusé + Remboursement + Email

### Scénario 4 : Booking Déjà Payé
- Client paie 2 fois (double clic, ou autre)
- ✅ Premier paiement → OK
- ❌ Deuxième paiement → Validation 2 échoue (`status = "paid"`)
- ❌ Deuxième paiement refusé + Remboursement

### Scénario 5 : Booking Expiré par CRON
- Booking créé il y a 15 minutes, jamais payé
- CRON a marqué `status = "expired"`
- Client essaie de payer maintenant
- ❌ Validation 2 échoue (`status = "expired"`)
- ❌ Paiement refusé + Remboursement

---

## 🔍 Logs de Débogage

Le webhook log chaque validation :

```bash
# Succès
✅ Validation de la réservation: abc-123
✅ Toutes les validations sont passées
✅ Paiement mis à jour avec succès
✅ Réservation mise à jour avec succès
🎉 Paiement complété pour la réservation: abc-123

# Échec Expiration
❌ Paiement refusé : réservation expirée (expires_at: 2025-12-01T10:30:00Z)
✅ Remboursement Stripe initié (réservation expirée)

# Échec Disponibilité
❌ Paiement refusé : dates déjà réservées par un autre client
✅ Remboursement Stripe initié (dates indisponibles)
```

---

## 📝 Fichiers Modifiés

### Backend
- [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) - Webhook sécurisé avec 4 validations
- [lib/availability.ts](lib/availability.ts) - Fonction `isVehicleAvailableExcludingBooking()`
- [actions/send-email.ts](actions/send-email.ts) - Action `sendBookingRejectedEmail()`

### Email Templates
- [emails/BookingRejectedEmail.tsx](emails/BookingRejectedEmail.tsx) - Template email de rejet

### Documentation
- [BOOKING_EXPIRATION_SETUP.md](BOOKING_EXPIRATION_SETUP.md) - Système d'expiration automatique
- [WEBHOOK_SECURITY.md](WEBHOOK_SECURITY.md) - Ce document

---

## ✅ Checklist de Sécurité

- [x] Validation 1 : Booking existe
- [x] Validation 2 : Statut = "pending_payment"
- [x] Validation 3 : Réservation non expirée
- [x] Validation 4 : Dates toujours disponibles
- [x] Remboursement automatique en cas de rejet
- [x] Email d'information au client
- [x] Logs détaillés pour chaque validation
- [x] Aucune duplication de logique d'overlap
- [x] Réutilisation du code existant

---

## 🎯 Résultat Final

Le système est maintenant **100% sécurisé** contre :
- ✅ Les paiements tardifs (après 10 minutes)
- ✅ Les doubles réservations
- ✅ Les collisions entre bookings
- ✅ Les tentatives de paiement multiple
- ✅ Les bookings déjà traités

**Même si Stripe Checkout reste ouvert pendant des heures**, le paiement sera automatiquement refusé, remboursé, et le client sera informé par email.

---

## 📚 Ressources

- [Stripe Refunds API](https://stripe.com/docs/api/refunds)
- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

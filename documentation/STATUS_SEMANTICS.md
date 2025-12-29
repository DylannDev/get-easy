# 📊 Sémantique des Statuts de Paiement et Réservation

**Date** : 2025-12-03

---

## 🎯 Clarification Importante

Lorsque Stripe **encaisse un paiement PUIS le rembourse**, le statut correct est **`"refunded"`** et non `"rejected"` ou `"payment_failed"`.

---

## 📋 Définition des Statuts

### Pour les Paiements (`payments` table)

| Statut | Signification | Quand l'utiliser |
|--------|---------------|------------------|
| `pending` | En attente | Checkout Stripe ouvert, paiement pas encore finalisé |
| `succeeded` | Réussi | Paiement accepté et booking confirmé |
| `failed` | Échoué | Carte refusée, fonds insuffisants, erreur technique Stripe |
| `refunded` | Remboursé | Paiement encaissé PUIS remboursé (cas normaux du webhook) |
| `rejected` | ❌ NE PLUS UTILISER | Ancien statut remplacé par `refunded` |

### Pour les Réservations (`bookings` table)

| Statut | Signification | Quand l'utiliser |
|--------|---------------|------------------|
| `pending_payment` | En attente de paiement | Booking créé, checkout ouvert, 10 minutes avant expiration |
| `paid` | Payé et confirmé | Paiement validé, réservation active |
| `expired` | Expiré | 10 minutes passées sans paiement (CRON) |
| `payment_failed` | Paiement échoué | Carte refusée, fonds insuffisants |
| `refunded` | Remboursé | Paiement accepté PUIS remboursé |
| `cancelled` | Annulé | Annulation manuelle par client ou admin |

---

## 🔧 Corrections Appliquées dans le Webhook

### VALIDATION 1 : Booking Introuvable

**Avant** :
```typescript
// ❌ INCORRECT
await supabase
  .from("payments")
  .update({ status: "rejected" })
  .eq("id", paymentId);
// Pas de remboursement Stripe !
```

**Après** :
```typescript
// ✅ CORRECT
await supabase
  .from("payments")
  .update({ status: "refunded" })
  .eq("id", paymentId);

// + Remboursement Stripe automatique
await stripe.refunds.create({
  payment_intent: session.payment_intent,
  reason: "requested_by_customer",
});
```

---

### VALIDATION 2 : Paiement en Double

**Avant** :
```typescript
// ❌ INCORRECT
await supabase
  .from("payments")
  .update({ status: "rejected" })
  .eq("id", paymentId);
```

**Après** :
```typescript
// ✅ CORRECT
await supabase
  .from("payments")
  .update({ status: "refunded" })
  .eq("id", paymentId);

// + Remboursement Stripe déjà présent
await stripe.refunds.create({
  payment_intent: session.payment_intent,
  reason: "duplicate",
});
```

---

### VALIDATION 3 : Dates Déjà Réservées

**Avant** :
```typescript
// ❌ INCORRECT
await supabase
  .from("bookings")
  .update({ status: "payment_failed" })
  .eq("id", bookingId);

await supabase
  .from("payments")
  .update({ status: "rejected" })
  .eq("id", paymentId);
```

**Après** :
```typescript
// ✅ CORRECT
await supabase
  .from("bookings")
  .update({ status: "refunded" })
  .eq("id", bookingId);

await supabase
  .from("payments")
  .update({ status: "refunded" })
  .eq("id", paymentId);

// + Remboursement Stripe déjà présent
await stripe.refunds.create({
  payment_intent: session.payment_intent,
  reason: "requested_by_customer",
});
```

---

## 🎓 Règle Générale

### Flowchart Décisionnel

```
Paiement reçu par Stripe
         ↓
    Encaissé ?
         ↓
    ✅ OUI
         ↓
  Validation OK ?
         ↓
    ❌ NON
         ↓
  Remboursement
         ↓
status = "refunded" ✅
```

**Autre flowchart** :

```
Paiement échoué AVANT encaissement
(carte refusée, fonds insuffisants)
         ↓
status = "failed" ✅
```

---

## 📊 Matrice de Décision

| Scénario | Stripe encaisse ? | Action | Status Payment | Status Booking |
|----------|-------------------|--------|----------------|----------------|
| Carte refusée | ❌ Non | Rien | `failed` | `payment_failed` |
| Booking introuvable | ✅ Oui | Refund | `refunded` | N/A |
| Paiement en double | ✅ Oui | Refund | `refunded` | (reste `paid`) |
| Dates déjà prises | ✅ Oui | Refund | `refunded` | `refunded` |
| Tout OK | ✅ Oui | Accepter | `succeeded` | `paid` |

---

## 🔍 Impact sur les Queries

### Comptabilité / Reporting

**Paiements réussis** (argent encaissé) :
```sql
SELECT * FROM payments
WHERE status IN ('succeeded', 'refunded');
-- "refunded" = argent encaissé puis remboursé
```

**Paiements échoués** (jamais encaissés) :
```sql
SELECT * FROM payments
WHERE status = 'failed';
```

**Chiffre d'affaires réel** :
```sql
SELECT SUM(amount) FROM payments
WHERE status = 'succeeded';
-- Exclut les "refunded"
```

---

## ✅ Avantages de Cette Sémantique

1. **Clarté comptable** : Distinction nette entre "jamais payé" et "payé puis remboursé"
2. **Traçabilité** : Historique complet des transactions Stripe
3. **Conformité** : Aligné avec la terminologie Stripe
4. **Analytics** : Meilleure compréhension du funnel de conversion
5. **Support client** : Communication claire avec les clients

---

## 📞 Exemples d'Utilisation

### Dashboard Admin

```typescript
// Réservations actives
const activeBookings = await supabase
  .from("bookings")
  .select("*")
  .eq("status", "paid");

// Réservations remboursées (à investiguer)
const refundedBookings = await supabase
  .from("bookings")
  .select("*")
  .eq("status", "refunded");

// Paiements échoués (problèmes techniques)
const failedPayments = await supabase
  .from("payments")
  .select("*")
  .eq("status", "failed");
```

### Support Client

```typescript
// Client : "Mon paiement n'a pas fonctionné"

const payment = await getPayment(paymentId);

if (payment.status === "failed") {
  return "Votre carte a été refusée. Veuillez réessayer avec un autre moyen de paiement.";
}

if (payment.status === "refunded") {
  return "Votre paiement a été accepté mais les dates n'étaient plus disponibles. Vous avez été remboursé automatiquement sous 5-10 jours.";
}
```

---

## 🔗 Fichiers Modifiés

- [app/api/stripe/webhook/route.ts:89-117](app/api/stripe/webhook/route.ts#L89-L117) - VALIDATION 1
- [app/api/stripe/webhook/route.ts:119-167](app/api/stripe/webhook/route.ts#L119-L167) - VALIDATION 2
- [app/api/stripe/webhook/route.ts:224-315](app/api/stripe/webhook/route.ts#L224-L315) - VALIDATION 3

---

## 📚 Documentation Associée

- [WEBHOOK_LOGIC_FIX.md](WEBHOOK_LOGIC_FIX.md) - Correction majeure de la logique
- [FINAL_IMPLEMENTATION_SUMMARY.md](FINAL_IMPLEMENTATION_SUMMARY.md) - Vue d'ensemble
- [CHANGELOG_2025-12-03.md](CHANGELOG_2025-12-03.md) - Changelog complet

---

**Version** : 1.0.0
**Date** : 2025-12-03
**Type** : Amélioration Sémantique

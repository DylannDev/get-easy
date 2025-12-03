# Configuration Stripe pour Get Easy

Ce guide explique comment configurer Stripe pour le système de paiement de Get Easy.

## 📋 Prérequis

1. Un compte Stripe (créez-en un sur [stripe.com](https://stripe.com))
2. Les clés API Stripe (disponibles dans le Dashboard Stripe)

## 🔑 Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Clé secrète Stripe (mode test)
STRIPE_WEBHOOK_SECRET=whsec_...  # Secret du webhook (voir ci-dessous)

# Supabase Service Role Key (nécessaire pour le webhook)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🪝 Configuration du Webhook Stripe

### En développement local (avec Stripe CLI)

1. **Installer Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Ou téléchargez depuis https://stripe.com/docs/stripe-cli
   ```

2. **Se connecter à votre compte Stripe**
   ```bash
   stripe login
   ```

3. **Écouter les webhooks localement**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copier le webhook secret**
   La commande ci-dessus affichera un secret webhook (commençant par `whsec_`).
   Copiez-le dans votre `.env.local` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Tester un paiement**
   ```bash
   stripe trigger checkout.session.completed
   ```

### En production

1. **Créer un endpoint webhook dans le Dashboard Stripe**
   - Allez sur [Dashboard Stripe > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
   - Cliquez sur "Add endpoint"
   - URL : `https://votre-domaine.com/api/stripe/webhook`

2. **Sélectionner les événements à écouter**
   - `checkout.session.completed` (obligatoire)
   - `payment_intent.payment_failed` (recommandé)
   - `charge.refunded` (recommandé)

3. **Copier le signing secret**
   Après avoir créé le webhook, copiez le "Signing secret" et ajoutez-le dans vos variables d'environnement de production.

## 🧪 Test des paiements

### Cartes de test Stripe

Pour tester les paiements en mode test, utilisez ces numéros de carte :

- **Paiement réussi** : `4242 4242 4242 4242`
- **Paiement échoué** : `4000 0000 0000 0002`
- **3D Secure requis** : `4000 0027 6000 3184`

Date d'expiration : N'importe quelle date future (ex: 12/34)
CVC : N'importe quel code à 3 chiffres (ex: 123)

## 📊 Flow de paiement

1. **Utilisateur soumet le formulaire de réservation**
   - Les données sont validées
   - Un customer est créé/récupéré dans Supabase
   - Un booking est créé avec status `pending_payment`
   - Un payment est créé avec status `created`

2. **Création de la session Stripe Checkout**
   - Une session Stripe est créée avec les métadonnées (bookingId, paymentId, customerId)
   - L'utilisateur est redirigé vers Stripe Checkout

3. **Paiement sur Stripe**
   - L'utilisateur entre ses informations de carte
   - Le paiement est traité par Stripe

4. **Webhook appelé par Stripe**
   - Event `checkout.session.completed` reçu
   - Le payment est mis à jour : status → `succeeded`
   - Le booking est mis à jour : status → `paid`

5. **Redirection de l'utilisateur**
   - Si succès : `/booking/success`
   - Si annulation : `/booking/cancelled`

## 🔍 Vérification des webhooks

Pour vérifier que les webhooks fonctionnent correctement :

1. Consultez les logs dans votre terminal
2. Vérifiez dans le Dashboard Stripe > Webhooks > Votre endpoint
3. Vérifiez dans Supabase que les statuts sont mis à jour

## 🚨 Dépannage

### Le webhook ne reçoit pas les événements

1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien configuré
2. Vérifiez que Stripe CLI écoute bien sur le bon port
3. Vérifiez les logs de votre serveur Next.js

### Le paiement fonctionne mais les tables ne sont pas mises à jour

1. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien configuré
2. Vérifiez les logs du webhook dans la console
3. Vérifiez les RLS policies de Supabase

### Erreur de signature webhook

1. Vérifiez que vous utilisez le bon `STRIPE_WEBHOOK_SECRET`
2. En local, assurez-vous d'utiliser le secret de Stripe CLI
3. En production, assurez-vous d'utiliser le secret du Dashboard

## 📚 Ressources

- [Documentation Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Documentation Webhooks Stripe](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

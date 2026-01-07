# Configuration Resend pour Get Easy

Ce guide explique comment configurer Resend pour l'envoi d'emails de confirmation de réservation.

## 📋 Prérequis

1. Un compte Resend (créez-en un sur [resend.com](https://resend.com))
2. Un domaine vérifié (ou utilisez le domaine de test fourni par Resend)

## 🔑 Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Resend Configuration
RESEND_API_KEY=re_...  # Clé API Resend

# Admin Email (pour les notifications de réservation)
ADMIN_EMAIL=admin@votredomaine.com  # Email de l'administrateur
```

## 🚀 Configuration

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit
3. Vérifiez votre email

### 2. Obtenir la clé API

1. Allez dans **Settings** > **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez un nom à votre clé (ex: "Get Easy Production")
4. Copiez la clé et ajoutez-la dans `.env.local` :
   ```env
   RESEND_API_KEY=re_votre_cle_api
   ```

### 3. Configurer le domaine (Production)

Pour utiliser votre propre domaine en production :

1. Allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `geteasylocation.com`)
4. Ajoutez les enregistrements DNS fournis par Resend à votre hébergeur
5. Attendez la vérification (généralement quelques minutes)

> **Note**: En développement, vous pouvez utiliser le domaine de test `onboarding@resend.dev` fourni par Resend.

### 4. Configurer l'email administrateur

Définissez l'email qui recevra les notifications de nouvelles réservations :

```env
ADMIN_EMAIL=admin@votredomaine.com
```

## 📧 Emails envoyés

Le système envoie **2 emails** lors d'un paiement réussi :

### 1. Email de confirmation au client

- **Destinataire** : Le client qui a effectué la réservation
- **Sujet** : `Confirmation de réservation - [Marque] [Modèle]`
- **Contenu** :
  - Confirmation du paiement
  - Détails de la réservation (véhicule, dates, prix)
  - Prochaines étapes
  - Email de contact

### 2. Email de notification à l'administrateur

- **Destinataire** : L'administrateur de l'agence
- **Sujet** : `Nouvelle réservation - [Marque] [Modèle]`
- **Contenu** :
  - ID de la réservation
  - Informations du client
  - Détails de la réservation
  - Montant payé
  - Actions à prendre

## 🧪 Test des emails

### En développement

1. Utilisez un email de test (votre propre email)
2. Effectuez une réservation test
3. Vérifiez votre boîte de réception

### Avec Stripe CLI en local

```bash
# Terminal 1 : Démarrer le serveur Next.js
pnpm dev

# Terminal 2 : Écouter les webhooks Stripe
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3 : Déclencher un événement de paiement test
stripe trigger checkout.session.completed
```

## 📊 Templates d'emails

Les templates sont créés avec **React Email** et **Tailwind CSS** :

- `emails/BookingPaidClientEmail.tsx` : Email client
- `emails/BookingPaidAdminEmail.tsx` : Email admin

### Prévisualiser les templates localement

Vous pouvez prévisualiser les templates d'emails en local :

```bash
# Installer React Email CLI (optionnel)
pnpm add -D react-email

# Démarrer le serveur de prévisualisation
pnpm email dev
```

Puis ouvrez [http://localhost:3001](http://localhost:3001) dans votre navigateur.

## 🔍 Monitoring

### Tableau de bord Resend

Consultez le tableau de bord Resend pour :

- Voir les emails envoyés
- Vérifier les taux d'ouverture
- Consulter les logs d'erreurs
- Gérer les bounces

### Logs de l'application

Les logs de l'application affichent :

- ✅ Email de confirmation envoyé au client
- ✅ Email de notification envoyé à l'admin
- ⚠️ Échec de l'envoi (avec détails de l'erreur)

## 🚨 Dépannage

### Les emails ne sont pas envoyés

1. Vérifiez que `RESEND_API_KEY` est correctement configuré
2. Vérifiez les logs du webhook Stripe
3. Consultez le tableau de bord Resend pour voir les erreurs
4. Vérifiez que le domaine est vérifié (en production)

### Les emails arrivent dans les spams

1. Configurez SPF, DKIM et DMARC pour votre domaine
2. Resend configure automatiquement DKIM lors de la vérification du domaine
3. Évitez les mots-clés de spam dans le sujet et le contenu

### Limite de taux dépassée

Le plan gratuit de Resend permet :

- 100 emails/jour
- 3 000 emails/mois

Pour augmenter ces limites, passez à un plan payant.

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/introduction)

## 🎨 Personnalisation des emails

Pour personnaliser les templates d'emails :

1. Modifiez les fichiers dans le dossier `emails/`
2. Utilisez les composants React Email et Tailwind CSS
3. Testez les changements avec React Email CLI
4. Déployez les modifications

Les emails sont automatiquement responsives et compatibles avec tous les clients email majeurs.

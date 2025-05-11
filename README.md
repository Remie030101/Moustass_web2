# Moustass - Application de Messages Vocaux Sécurisés

Application web permettant l'enregistrement, le chiffrement et le partage de messages vocaux de manière sécurisée.

## Fonctionnalités

- Authentification des utilisateurs (utilisateur/admin)
- Enregistrement de messages vocaux
- Chiffrement AES-256 des messages
- Partage de messages entre utilisateurs
- Gestion des utilisateurs par l'administrateur
- Abonnement premium avec paiement Stripe

## Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v8 ou supérieur)
- Compte Stripe pour les paiements
- Compte email pour l'envoi des emails de réinitialisation

## Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
cd moustass
```

2. Installer les dépendances du backend :
```bash
cd backend
npm install
```

3. Installer les dépendances du frontend :
```bash
cd ../frontend
npm install
```

4. Configurer les variables d'environnement :
- Copier le fichier `.env.example` en `.env` dans le dossier backend
- Remplir les variables d'environnement avec vos propres valeurs

5. Créer la base de données :
```bash
mysql -u root -p < db/schema.sql
```

## Démarrage

1. Démarrer le backend :
```bash
cd backend
npm run dev
```

2. Démarrer le frontend :
```bash
cd frontend
npm run dev
```

L'application sera accessible à l'adresse http://localhost:5173

## Configuration

### Base de données
- Créer une base de données MySQL
- Configurer les variables DB_* dans le fichier .env

### Email
- Configurer un compte SMTP pour l'envoi d'emails
- Remplir les variables SMTP_* dans le fichier .env

### Stripe
- Créer un compte Stripe
- Obtenir les clés API dans le dashboard Stripe
- Configurer les variables STRIPE_* dans le fichier .env

## Sécurité

- Les mots de passe sont hashés avec bcrypt
- Les messages vocaux sont chiffrés avec AES-256
- L'authentification utilise JWT
- Les routes sensibles sont protégées par des middlewares

## Structure du projet

```
moustass/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── db/
    └── schema.sql
```

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

MIT

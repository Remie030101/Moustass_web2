# Moustass - Application de Messages Vocaux Sécurisés

Moustass est une application web permettant l'enregistrement, le chiffrement et le partage de messages vocaux de manière sécurisée. Elle propose une gestion avancée des utilisateurs, un abonnement premium avec paiement Stripe, et une configuration serveur optimisée avec Apache.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack Technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Sécurité](#sécurité)
- [Structure du projet](#structure-du-projet)
- [Tests et Benchmark](#tests-et-benchmark)

---

## Fonctionnalités

- Authentification des utilisateurs (utilisateur/admin)
- Enregistrement et partage de messages vocaux
- Chiffrement AES-256 des messages
- Gestion des utilisateurs par l'administrateur
- Abonnement premium avec paiement Stripe
- Réinitialisation de mot de passe par email
- Interface web moderne (frontend Vanilla)
- API REST sécurisée (backend Node.js)
- Configuration serveur Apache avec SSL, cache, et headers de sécurité

---

## Stack Technique

- **Frontend** : Vanilla js
- **Backend** : Node.js (Express)
- **Base de données** : MySQL
- **Paiement** : Stripe
- **Serveur web** : Apache 2.4+ (avec SSL, cache, headers de sécurité)
- **Email** : SMTP

---

## Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v8 ou supérieur)
- Apache 2.4+ avec modules : mod_ssl, mod_rewrite, mod_headers, mod_expires, mod_deflate, mod_cache, mod_cache_disk
- Compte Stripe pour les paiements
- Compte email SMTP pour l'envoi des emails

---

## Installation

1. **Cloner le repository :**
   ```bash
   git clone [URL_DU_REPO]
   cd moustass
   ```

2. **Installer les dépendances du backend :**
   ```bash
   cd backend
   npm install
   ```


3. **Configurer les variables d'environnement :**
   - Copier `.env.example` en `.env` dans le dossier backend
   - Remplir les variables d'environnement avec vos propres valeurs

4. **Créer la base de données :**
   ```bash
   mysql -u root -p < db/init.sql
   ```

5. **Configurer Apache :**
   - Copier `apache.conf` et `ssl.conf` dans le dossier de configuration d'Apache (ex: `/usr/local/apache2/conf/`)
   - Placer le certificat SSL (`server.crt`) et clé privée (`server.key`) dans le dossier `conf`
   - S'assurer que tous les modules requis sont activés
   - Redémarrer Apache

---

## Configuration

### Base de données
- Créer une base MySQL
- Configurer les variables `DB_*` dans le fichier `.env` du backend


### Apache
- Les fichiers de configuration (`apache.conf`, `ssl.conf`) incluent :
  - Redirection HTTP vers HTTPS
  - Activation du SSL/TLS
  - Headers de sécurité (HSTS, X-Frame-Options, etc.)
  - Cache navigateur et disque
  - Logs d'accès et d'erreur

---

## Démarrage

1. **Démarrer le backend :**
   ```bash
   cd backend
   npm run dev
   ```


2. **Accéder à l'application :**
   - Frontend : http://localhost:80 (via Apache)
   - API backend : http://localhost:3000 (par défaut)

---

## Sécurité

- Mots de passe hashés avec bcrypt
- Messages vocaux chiffrés avec AES-256
- Routes sensibles protégées par des middlewares
- Headers de sécurité et SSL/TLS via Apache

---

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
├── db/
│   └── init.sql
├── apache.conf
├── ssl.conf
└── README.md
```

---

## Tests et Benchmark

- Pour exécuter les tests de charge avec Apache Benchmark :
  ```bash
  ./scripts/load-test-ab.sh
  ```
- Vérifier le KeepAlive :
  ```bash
  curl -v http://localhost
  ```

---



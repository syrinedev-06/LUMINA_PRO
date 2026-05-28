# Lumina Workspace ✨

Lumina Workspace est une application web moderne de gestion de tâches (façon Kanban), conçue pour optimiser le suivi de projet au sein des équipes. 

Ce projet a été développé avec une architecture séparée : un **Frontend en Vanilla JS** et un **Backend en Node.js / Express** connecté à une base de données **MySQL**.

---

## 🚀 Fonctionnalités Principales

*   **Tableau de bord Kanban** : Gestion dynamique des tâches (À faire, En cours, Terminé) avec système de Drag & Drop (Glisser-Déposer).
*   **Authentification Sécurisée** : Inscription et Connexion protégées par un hachage des mots de passe (**Bcrypt**) et des sessions basées sur des jetons (**JWT**).
*   **Historique & Corbeille** : Traçabilité complète des actions des utilisateurs (Création, Modification, Suppression) avec possibilité de restauration (Soft Delete).
*   **Statistiques visuelles** : Graphiques dynamiques (Chart.js) pour visualiser la progression des tâches.
*   **Mode Sombre (Dark Mode)** : Interface utilisateur soignée s'adaptant aux préférences visuelles, avec sauvegarde des paramètres.

---

## 🛠️ Stack Technique

*   **Frontend :** HTML5, CSS3 (Variables CSS, Flexbox), JavaScript (Vanilla, API Fetch), Chart.js.
*   **Backend :** Node.js, Express.js.
*   **Base de données :** MySQL (pilote `mysql2`).
*   **Sécurité :** `jsonwebtoken` (JWT), `bcrypt`, `cors`.

---

## ⚙️ Prérequis

Avant d'installer le projet, assurez-vous d'avoir installé sur votre machine :
1. **Node.js** (incluant `npm`).
2. Un serveur local MySQL comme **XAMPP**, WAMP ou MAMP.

---

## 📦 Installation et Démarrage

### 1. Base de données
1. Lancez votre serveur **MySQL** via XAMPP.
2. Ouvrez PhpMyAdmin (généralement `http://localhost/phpmyadmin`).
3. Créez une nouvelle base de données nommée exactement **`lumina_pro`**.
*(Note : Les tables de la base de données se construiront automatiquement lors du premier démarrage du serveur Node.js).*

### 2. Lancement du Backend (API)
1. Ouvrez un terminal et naviguez dans le dossier `backend` du projet :
   ```bash
   cd backend
   ```
2. Installez les dépendances nécessaires :
   ```bash
   npm install
   ```
3. Démarrez le serveur serveur :
   ```bash
   node server.js
   ```
   *Le terminal devrait afficher : "Connecté à la base de données MySQL !" et "Le serveur Lumina tourne sur http://localhost:3000".*

### 3. Lancement du Frontend (Interface)
1. Ouvrez le dossier `frontend` dans votre éditeur de code (ex: VS Code).
2. Lancez le fichier `index.html` ou `login.html` en utilisant l'extension **Live Server**.
3. Inscrivez-vous, connectez-vous, et profitez de l'application !

---

## 🔒 Sécurité et Bonnes Pratiques
* L'application utilise des requêtes SQL paramétrées (`?`) pour se protéger contre les Injections SQL.
* Les mots de passe ne sont jamais stockés en clair.
* Le Frontend et le Backend communiquent exclusivement via des API RESTful avec vérification systématique de l'en-tête `Authorization`.

---
*Projet réalisé dans le cadre de la certification Développeur Web et Web Mobile.*

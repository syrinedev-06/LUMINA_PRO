# 🗂️ Lumina Pro

Application web collaborative de gestion de tâches basée sur la méthode **Kanban**.
Projet réalisé dans le cadre du titre professionnel **DWWM** (Développeur Web et Web Mobile) — La Plateforme_, promotion 2025/2026.

**Auteure :** Syrine Ben Hassine

---

## Fonctionnalités

- Tableau Kanban avec **colonnes personnalisables** (créer, renommer, supprimer)
- **CRUD complet** des tâches (créer, modifier, déplacer, supprimer)
- Déplacement des tâches entre colonnes via **boutons directionnels** (⬅️ ➡️) — un choix délibéré face au drag & drop natif, pour garder l'interface et le code simples
- Assignation des tâches aux membres de l'équipe, avec date d'échéance et alerte visuelle en cas de retard
- Authentification sécurisée par **JWT** (expiration 24h)
- Mots de passe hachés avec **bcrypt** (10 rounds)
- Protection contre le brute-force : limitation du nombre de tentatives de connexion par IP
- Gestion des rôles : **admin** (gestion équipe + colonnes) et **utilisateur**
- Page **Statistiques** avec graphique camembert SVG généré en JavaScript pur (sans bibliothèque), utilisant `Promise.all()` pour charger tâches et membres en parallèle
- Interface **responsive** (desktop, tablette ≤ 900px, mobile ≤ 600px) avec attributs ARIA (accessibilité WCAG 2.1 / RGAA 4.1.2)
- Documentation API interactive avec **Swagger UI**
- Journal d'audit (table `logs`) : chaque suppression de tâche est tracée

---

## Stack technique

| Couche | Technologie | Version exacte |
|---|---|---|
| Front-end | HTML5, CSS3 modulaire, JavaScript ES6+ Vanilla | — (sans framework, sans build) |
| Back-end | Node.js, Express | Express 5.2.1, Node.js v24.14.0 |
| Base de données | MySQL (via `mysql2`) | MySQL Server 8.0.45, mysql2 3.22.2 |
| Sécurité | jsonwebtoken, bcrypt, dotenv, cors | jsonwebtoken 9.0.3, bcrypt 6.0.0, dotenv 17.4.2, cors 2.8.6 |
| Documentation | swagger-ui-express | 5.0.1 |
| Versioning | Git + GitHub | — |

---

## Prérequis

- [Node.js](https://nodejs.org) v18+ (développé avec v24.14.0)
- [MySQL Server 8.0](https://dev.mysql.com/downloads/mysql/) (développé avec 8.0.45)

---

## Installation

**1. Cloner le projet**
```bash
git clone https://github.com/syrinedev-06/LUMINA_PRO.git
cd LUMINA_PRO
```

**2. Installer les dépendances backend**
```bash
cd backend
npm install
```

**3. Configurer les variables d'environnement**
Copier le fichier d'exemple et renseigner les valeurs (ce fichier `.env` n'est jamais commité) :
```bash
cp backend/.env.example backend/.env
```
Contenu du `.env` à adapter :
```
SECRET_KEY=votre_cle_secrete_ici
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=lumina_pro
PORT=3000
```

**4. Démarrer MySQL**
Ouvrir XAMPP et démarrer le service **MySQL** (ou s'assurer que le service MySQL80 tourne).

**5. Créer la base de données**
Dans phpMyAdmin (`http://localhost/phpmyadmin`), créer une base nommée :
```sql
CREATE DATABASE lumina_pro;
```
Les 4 tables (`users`, `columns`, `tasks`, `logs`) sont créées automatiquement au premier démarrage du serveur — voir `database/schema.sql` pour le schéma de référence.

**6. Lancer le serveur**
```bash
npm start
```
Le serveur tourne sur **http://localhost:3000**.

**7. Ouvrir l'application**
Ouvrir `frontend/login.html` dans un navigateur (ou via Live Server VS Code).

---

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|----------|
| Admin | admin@lumina.com | Lumina1! |
| Utilisateur | user@lumina.com | Lumina1! |

Aucun script de seed n'est maintenu actuellement (`seed.js` a été retiré lors de la simplification pour la soutenance). Ces comptes sont créés via le flux normal `/api/auth/register`, puis le rôle admin est défini avec :
```sql
UPDATE users SET role='admin' WHERE email='admin@lumina.com';
```

---

## Structure du projet

```
lumina_pro/
├── frontend/
│   ├── index.html          # Tableau de bord Kanban
│   ├── login.html          # Page de connexion / inscription
│   ├── css/                # Modules CSS (variables, layout, kanban, responsive, etc.)
│   └── js/
│       ├── api.js          # authFetch() + escapeHTML()
│       ├── auth.js         # Connexion / Inscription
│       ├── kanban.js       # Affichage du tableau
│       ├── tasks.js        # CRUD tâches
│       ├── columns.js      # CRUD colonnes
│       ├── ui.js           # Événements UI (sidebar, modales)
│       ├── team.js         # Gestion de l'équipe (admin)
│       └── profile.js      # Page Statistiques (camembert SVG)
├── backend/
│   ├── server.js           # Point d'entrée Express, création automatique des tables
│   ├── config/
│   │   └── db.js           # Configuration connexion MySQL, lue depuis process.env
│   ├── middleware/
│   │   └── security.js     # Middleware verifyToken (JWT)
│   ├── routes/
│   │   ├── auth.js         # POST /login, POST /register
│   │   ├── tasks.js        # CRUD tâches
│   │   ├── columns.js      # CRUD colonnes
│   │   └── users.js        # GET/DELETE utilisateurs
│   ├── swagger.json        # Documentation OpenAPI
│   └── .env.example        # Modèle de configuration
└── database/
    └── schema.sql           # Schéma SQL de référence (correspond exactement à server.js)
```

---

## Documentation de l'API

Une fois le serveur démarré, la documentation Swagger est disponible sur :
**http://localhost:3000/api-docs**

| Méthode | Route | Description | Auth |
|--------|-------|--------------|------|
| POST | /api/auth/login | Se connecter | Non |
| POST | /api/auth/register | S'inscrire | Non |
| GET | /api/tasks | Récupérer toutes les tâches | JWT |
| POST | /api/tasks | Créer une tâche | JWT |
| PUT | /api/tasks/:id | Modifier / déplacer une tâche | JWT |
| DELETE | /api/tasks/:id | Supprimer une tâche (propriétaire ou admin uniquement) | JWT |
| GET | /api/columns | Récupérer les colonnes | JWT |
| POST | /api/columns | Créer une colonne | JWT |
| PUT | /api/columns/:id | Renommer une colonne | JWT |
| DELETE | /api/columns/:id | Supprimer une colonne (cascade sur ses tâches) | JWT |
| GET | /api/users | Voir l'équipe | JWT |
| DELETE | /api/users/:id | Supprimer un utilisateur | JWT |

---

## Sécurité

- **Injection SQL** : requêtes préparées avec placeholders `?` sur toutes les routes
- **XSS** : `escapeHTML()` appliqué à tout contenu utilisateur injecté dans le DOM
- **Mots de passe** : hachage irréversible bcrypt avec sel unique par utilisateur
- **Authentification** : JWT signé HMAC-SHA256, expiration 24h, vérifié par middleware, secret lu depuis `.env` (jamais codé en dur, jamais commité)
- **CSRF** : JWT envoyé dans le header `Authorization`, jamais en cookie
- **IDOR** : la suppression d'une tâche vérifie côté serveur que le demandeur en est propriétaire ou est admin
- **Brute-force** : limitation à 5 tentatives de connexion échouées par IP, blocage de 15 minutes au-delà

### Limites connues (documentées volontairement, pas cachées)
- Pas encore de suite de tests automatisés (Jest/Supertest identifié comme amélioration prioritaire)
- Fonctionne uniquement en local pour l'instant (XAMPP + Node), pas de conteneurisation ni d'hébergement distant
- Pas de séparation formelle routes/contrôleurs/modèles — les routes contiennent directement leur SQL, simplification délibérée pour un projet solo de cette taille

---

*Projet réalisé pour la certification Développeur Web et Web Mobile (DWWM) — La Plateforme_, 2025/2026.*

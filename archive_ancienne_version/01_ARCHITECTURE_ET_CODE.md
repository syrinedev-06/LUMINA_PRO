# LUMINA PRO — DÉCORTICATION COMPLÈTE DU CODE
## Fichier 1 : Architecture, rôle de chaque fichier, chaque fonction

---

## TABLE DES MATIÈRES
1. [Vue d'ensemble de l'architecture](#architecture)
2. [Backend — server.js](#serverjs)
3. [Backend — middleware/security.js](#security)
4. [Backend — routes/auth.js](#auth-back)
5. [Backend — routes/tasks.js](#tasks-back)
6. [Backend — routes/columns.js](#columns-back)
7. [Backend — routes/users.js](#users-back)
8. [Frontend — js/api.js](#api-front)
9. [Frontend — js/auth.js](#auth-front)
10. [Frontend — js/kanban.js](#kanban-front)
11. [Frontend — js/tasks.js](#tasks-front)
12. [Frontend — js/columns.js](#columns-front)
13. [Frontend — js/ui.js](#ui-front)
14. [Frontend — js/team.js](#team-front)
15. [Frontend — js/profile.js](#profile-front)
16. [Base de données — schema.sql](#bdd)

---

## 1. ARCHITECTURE GLOBALE {#architecture}

```
NAVIGATEUR (Client)                    SERVEUR NODE.JS (Port 3000)         BASE DE DONNÉES MySQL
┌──────────────────────┐               ┌──────────────────────────┐        ┌──────────────────┐
│  login.html          │               │  server.js               │        │  users           │
│  index.html          │   HTTP/JSON   │    ↓ middleware CORS      │  SQL   │  columns         │
│  js/auth.js    ──────┼──────────────▶│    ↓ express.json()      │───────▶│  tasks           │
│  js/api.js           │◀──────────────┼──  ↓ verifyToken (JWT)   │        │  logs            │
│  js/kanban.js        │   JSON resp.  │    ↓                      │        │  notifications   │
│  js/tasks.js         │               │  routes/auth.js           │        └──────────────────┘
│  js/columns.js       │               │  routes/tasks.js          │
│  js/team.js          │               │  routes/columns.js        │
│  js/profile.js       │               │  routes/users.js          │
│  js/ui.js            │               └──────────────────────────┘
└──────────────────────┘
```

**Flux d'une requête typique :**
1. L'utilisateur clique sur "créer une tâche" dans le navigateur
2. `js/tasks.js` → `authFetch()` → envoie `POST /api/tasks` avec le token JWT dans le header
3. `server.js` reçoit → `verifyToken` vérifie le JWT → si OK passe à `routes/tasks.js`
4. `routes/tasks.js` exécute la requête SQL → répond avec JSON `{ message: "Tâche créée!" }`
5. `js/tasks.js` reçoit la réponse → appelle `fetchTasks()` pour rafraîchir l'affichage

---

## 2. BACKEND — server.js {#serverjs}

### Rôle
Point d'entrée du serveur. Configure tout et démarre l'écoute.

### Ligne par ligne

```js
const app = express();
```
Crée l'application Express. `app` est l'objet central qui gère toutes les requêtes HTTP.

```js
app.use(cors());
```
**CORS = Cross-Origin Resource Sharing**. Autorise les requêtes venant d'une autre origine (ex: frontend sur `file://` ou port différent). Sans ça → erreur "blocked by CORS policy" dans le navigateur.

```js
app.use(express.json());
```
Middleware qui parse le corps des requêtes HTTP au format JSON. Sans ça, `req.body` serait `undefined`.

```js
const db = mysql.createConnection(dbConfig);
db.connect((err) => { ... });
```
Ouvre la connexion physique avec MySQL. Le callback `(err)` est appelé quand la connexion est établie ou échoue.

```js
app.use((req, res, next) => {
    req.db = db;
    next();
});
```
**Middleware personnalisé** : injecte la connexion `db` dans chaque requête. Toutes les routes peuvent ensuite faire `req.db.query(...)` sans importer `db` directement. `next()` est obligatoire sinon la requête se bloque ici.

```js
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', verifyToken, require('./routes/tasks'));
```
- `/api/auth` est **publique** (pas de `verifyToken`) → on peut se connecter sans être déjà connecté
- `/api/tasks` est **protégée** : `verifyToken` s'exécute avant chaque route de tasks

```js
app.listen(PORT, () => { ... });
```
Démarre le serveur sur le port 3000. Le callback confirme le démarrage.

### Auto-création des tables
```js
tables.forEach(sql => { db.query(sql, ...) });
```
Crée les tables si elles n'existent pas. `IF NOT EXISTS` rend l'opération idempotente (sans risque si déjà fait).

### Colonnes par défaut
```js
db.query("SELECT COUNT(*) as count FROM columns", (err, result) => {
    if (!err && result[0].count === 0) {
        db.query("INSERT INTO columns ...");
    }
});
```
Si la table `columns` est vide → crée "À faire", "En cours", "Terminé". Initialisation d'une application.

---

## 3. BACKEND — middleware/security.js {#security}

### Rôle
Vérifie que chaque requête protégée possède un JWT valide.

### Fonctionnement détaillé
```js
const authHeader = req.headers['authorization'];
```
Lit le header HTTP `Authorization`. En JavaScript, les headers sont en minuscules.

```js
if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "..." });
}
```
**401 Unauthorized** = pas de token du tout. Le format standard est `Bearer eyJhbGci...`.

```js
const token = authHeader.split(' ')[1];
```
Sépare `"Bearer eyJ..."` en tableau `["Bearer", "eyJ..."]` et prend l'index 1.

```js
const decoded = jwt.verify(token, SECRET_KEY);
```
- Si le token est valide et non expiré → retourne le payload `{ id: 1, role: 'admin', iat: ..., exp: ... }`
- Si invalide ou expiré → lève une exception → `catch` retourne **403 Forbidden**

```js
req.user = decoded;
next();
```
Injecte les données de l'utilisateur dans `req`. Les routes suivantes peuvent lire `req.user.id` et `req.user.role`.

### Différence 401 vs 403
- **401** : Token manquant → "qui êtes-vous ?"
- **403** : Token présent mais invalide/expiré → "vous n'avez pas le droit"

---

## 4. BACKEND — routes/auth.js {#auth-back}

### Route POST /api/auth/register

```js
const hashedPassword = await bcrypt.hash(password, 10);
```
**bcrypt.hash(password, saltRounds)** :
- `password` = mot de passe en clair saisi par l'utilisateur
- `10` = nombre de "rounds" de hachage (coût algorithmique). Plus c'est élevé, plus c'est lent → difficile à bruteforcer
- Résultat : une chaîne comme `$2b$10$abc123...` qui contient le sel + le hash

**Différence hash vs chiffrement :**
- **Hash** = irréversible. On ne peut jamais retrouver le mot de passe original. On compare en rehachant.
- **Chiffrement** = réversible. On peut déchiffrer si on a la clé.

```js
const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
req.db.query(sql, [name, email, hashedPassword], ...);
```
**Requête préparée** : les `?` sont des placeholders. Le driver MySQL remplace les `?` par les valeurs du tableau en les échappant automatiquement → **protection contre l'injection SQL**.

```js
res.status(201).json({ message: "Utilisateur créé avec succès !" });
```
**201 Created** = code HTTP standard pour la création d'une ressource.

### Route POST /api/auth/login

```js
const sql = "SELECT * FROM users WHERE email = ?";
```
Cherche l'utilisateur par email unique.

```js
const isMatch = await bcrypt.compare(password, user.password);
```
- `password` = ce que l'utilisateur vient de taper
- `user.password` = le hash stocké en BDD
- bcrypt extrait le sel du hash stocké, re-hache le mot de passe saisi avec ce même sel, compare les résultats
- Retourne `true` si identiques, `false` sinon

```js
const token = jwt.sign(
    { id: user.id, role: user.role }, 
    SECRET_KEY, 
    { expiresIn: '24h' }
);
```
**jwt.sign(payload, secret, options)** :
- `payload` = données à encoder (lisibles mais pas modifiables sans la clé)
- `SECRET_KEY` = clé secrète pour signer
- `expiresIn: '24h'` = le token expire dans 24 heures

**Structure d'un JWT :**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← Header (encodé Base64)
.eyJpZCI6MSwicm9sZSI6ImFkbWluIn0=        ← Payload (encodé Base64)
.HMAC_SIGNATURE                          ← Signature (HMAC-SHA256)
```

```js
res.json({
    token: token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
});
```
On n'envoie **jamais** le mot de passe, même haché.

---

## 5. BACKEND — routes/tasks.js {#tasks-back}

### GET / — Récupérer toutes les tâches

```sql
SELECT tasks.*, users.name as assigned_name 
FROM tasks 
LEFT JOIN users ON tasks.id_assigned = users.id 
ORDER BY id_col ASC, created_at DESC
```

**LEFT JOIN vs INNER JOIN :**
- `LEFT JOIN` = retourne TOUTES les tâches, même celles sans utilisateur assigné (assigned_name = NULL)
- `INNER JOIN` = retournerait SEULEMENT les tâches avec un utilisateur assigné → tâches non assignées perdues

**ORDER BY id_col ASC, created_at DESC :**
- Tri principal : par colonne (gauche → droite)
- Tri secondaire : par date de création (plus récente en premier dans chaque colonne)

### POST / — Créer une tâche

```js
const findColSql = "SELECT id FROM columns ORDER BY position ASC LIMIT 1";
```
Si pas de colonne fournie par le client → on prend la première colonne automatiquement.

```js
const targetCol = id_col || cols[0].id;
```
Opérateur `||` (OU logique) : si `id_col` est falsy (null/undefined/0), on utilise `cols[0].id`.

### PUT /:id — Modifier une tâche (requête dynamique)

```js
let sql = "UPDATE tasks SET ";
let params = [];

if (title) { sql += "title = ?, "; params.push(title); }
if (description !== undefined) { sql += "description = ?, "; params.push(description); }
// ...
sql = sql.slice(0, -2); // Supprime ", " final
sql += " WHERE id = ?";
params.push(taskId);
```

**Pourquoi dynamique ?** Quand on déplace une tâche (drag & drop), on envoie seulement `{ id_col: 3 }`. Quand on édite, on envoie titre + description + priorité. Une seule route gère les deux cas.

**`sql.slice(0, -2)`** : coupe les 2 derniers caractères (`, ` de la dernière condition).

**Exemple :** Si on envoie `{ title: "Nouveau titre", id_col: 2 }` :
```sql
UPDATE tasks SET title = ?, id_col = ? WHERE id = ?
params = ["Nouveau titre", 2, 5]
```

### DELETE /:id — Supprimer une tâche

```js
const sql = "DELETE FROM tasks WHERE id = ?";
req.db.query(sql, [req.params.id], ...);
```
`req.params.id` = la valeur `:id` dans l'URL. Ex: `DELETE /api/tasks/5` → `req.params.id = "5"`.

**Logs d'activité :** Chaque CREATE/UPDATE/DELETE insère une ligne dans la table `logs`. C'est l'**audit trail** (traçabilité des actions).

---

## 6. BACKEND — routes/columns.js {#columns-back}

### Calcul de position automatique (POST)
```js
req.db.query("SELECT MAX(position) as maxPos FROM columns", (err, result) => {
    const nextPos = (result[0].maxPos || 0) + 1;
    ...
});
```
`MAX(position)` = fonction d'agrégation SQL qui retourne la valeur maximale de la colonne `position`.
Si table vide → retourne NULL → `(null || 0) + 1 = 1`.
Si 3 colonnes existent → `MAX = 3` → nouvelle position = 4.

### DELETE + CASCADE
La requête `DELETE FROM columns WHERE id = ?` déclenche automatiquement la suppression de toutes les tâches liées, grâce à la contrainte `FOREIGN KEY (id_col) REFERENCES columns(id) ON DELETE CASCADE` définie en BDD.

---

## 7. BACKEND — routes/users.js {#users-back}

### GET / — Projection SQL
```js
const sql = "SELECT id, name, email, role FROM users";
```
On sélectionne explicitement les colonnes — **jamais** `SELECT *` sur users, car cela exposerait le champ `password` (même haché, c'est une information sensible).

### DELETE /:id — Suppression physique
```js
const sql = "DELETE FROM users WHERE id = ?";
```
**Problème potentiel :** les tâches assignées à cet utilisateur ont `id_assigned` qui devient orphelin. En production, on préférerait :
- **Soft delete** : ajouter un champ `is_deleted = 1` au lieu de supprimer physiquement
- Ou définir `ON DELETE SET NULL` sur la clé étrangère `id_assigned`

---

## 8. FRONTEND — js/api.js {#api-front}

### escapeHTML() — Protection XSS
```js
function escapeHTML(str) {
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
```
**Faille XSS (Cross-Site Scripting) :**
Sans cette protection, si un utilisateur crée une tâche avec le titre `<script>alert('piraté')</script>`, ce code s'exécuterait dans le navigateur de tous les autres utilisateurs.

Avec `escapeHTML` :
- `<` devient `&lt;` (affiché comme `<` mais pas interprété comme balise HTML)
- `>` devient `&gt;`
- etc.

Cette fonction est appelée sur **tout** texte venant de la base de données avant de l'injecter dans le HTML.

### authFetch() — Requêtes authentifiées
```js
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    options.headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(url, options);
    
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
    return response;
}
```

**Rôle :** Wrapper autour de `fetch()` qui ajoute automatiquement le JWT dans chaque requête.

**`fetch()` = API Web native** pour faire des requêtes HTTP asynchrones. Remplace l'ancien `XMLHttpRequest`.

**`async/await` :**
- `async function` déclare une fonction asynchrone
- `await` pause l'exécution jusqu'à que la Promise soit résolue
- Sans `await` : `fetch()` retourne une `Promise` non résolue, pas les données

**localStorage :**
- Stockage clé/valeur dans le navigateur
- Persistant même après fermeture du navigateur
- `localStorage.getItem('token')` lit le JWT
- `localStorage.setItem('token', valeur)` écrit
- `localStorage.clear()` supprime tout

**Gestion du 401 :** Si le token est expiré, le serveur répond 401 → on efface tout et on redirige vers login.

---

## 9. FRONTEND — js/auth.js {#auth-front}

### Inscription
```js
document.addEventListener('DOMContentLoaded', () => { ... });
```
Attend que le DOM soit chargé avant d'attacher les événements. Sans ça, `getElementById` retournerait `null`.

```js
registerForm.onsubmit = async (e) => {
    e.preventDefault();
    ...
};
```
`e.preventDefault()` empêche le comportement par défaut du formulaire (rechargement de page). On gère l'envoi manuellement via `fetch`.

```js
const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
});
```
- `method: 'POST'` → création de ressource
- `Content-Type: application/json` → dit au serveur que le corps est du JSON
- `JSON.stringify(...)` → convertit l'objet JS en chaîne JSON `{"name":"...","email":"...","password":"..."}`

### Connexion et stockage JWT
```js
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
window.location.href = 'index.html';
```
Stocke le token et les infos user, puis redirige vers le dashboard.

---

## 10. FRONTEND — js/kanban.js {#kanban-front}

### Vérification de sécurité côté client
```js
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
    return;
}
```
**ATTENTION :** Ce n'est PAS de la vraie sécurité. N'importe qui peut supprimer cette vérification dans les DevTools. La vraie sécurité est côté serveur (`verifyToken`). Ici, c'est juste pour l'UX (expérience utilisateur).

### Affichage conditionnel selon le rôle
```js
if (user.role === 'admin') {
    teamNav.style.display = 'block';
} else {
    teamNav.style.display = 'none';
}
```
Cache l'onglet "Équipe" aux non-admins. Mais un non-admin pourrait forcer l'affichage. Le serveur bloque vraiment l'accès à `GET /api/users` si le rôle n'est pas admin (normalement — ici le middleware vérifie juste le JWT, pas le rôle).

### fetchTasks() — Chargement du tableau
```js
async function fetchTasks() {
    try {
        const resCol = await authFetch('http://localhost:3000/api/columns');
        const columns = await resCol.json();
        
        const resTasks = await authFetch('http://localhost:3000/api/tasks');
        const tasks = await resTasks.json();
        
        renderBoard(columns, tasks);
    } catch (e) {
        board.innerHTML = "<p style='color:red;'>Impossible de se connecter...</p>";
    }
}
```
**2 requêtes séquentielles** : d'abord les colonnes, puis les tâches. Ensuite on passe les deux à `renderBoard`.

**try/catch :** Si le serveur est éteint, `fetch` lève une exception → `catch` affiche un message d'erreur propre au lieu de crasher.

### renderBoard() — Affichage HTML dynamique
```js
columns.forEach((col, index) => {
    const colTasks = tasks.filter(t => t.id_col === col.id);
    // ...
    colEl.innerHTML = `
        <h4>${col.title.toUpperCase()}</h4>
        <div class="task-list">
            ${colTasks.map(task => `
                <div class="task-card">
                    <h5>${escapeHTML(task.title)}</h5>
                    ...
                </div>
            `).join('')}
        </div>
    `;
});
```

- `.forEach()` → boucle sur chaque colonne
- `.filter()` → retourne seulement les tâches de cette colonne (`id_col === col.id`)
- `.map()` → transforme chaque tâche en chaîne HTML
- `.join('')` → colle les chaînes sans séparateur
- **Template literals** (backticks) → permettent l'interpolation `${variable}` et le multiline

**Boutons de déplacement :**
```js
${prevCol ? `<span onclick="moveTask(${task.id}, ${prevCol.id})">⬅️</span>` : `<span></span>`}
```
Opérateur ternaire : si `prevCol` existe → affiche bouton gauche, sinon → espace vide.

---

## 11. FRONTEND — js/tasks.js {#tasks-front}

### handleTaskSubmit() — POST ou PUT
```js
const method = id ? 'PUT' : 'POST';
const url = id ? `http://localhost:3000/api/tasks/${id}` : 'http://localhost:3000/api/tasks';
```
Si un ID est présent dans le formulaire caché → modification (PUT), sinon → création (POST).

**REST API conventions :**
- `POST /api/tasks` = créer
- `PUT /api/tasks/5` = modifier la tâche 5
- `DELETE /api/tasks/5` = supprimer la tâche 5
- `GET /api/tasks` = lister

### moveTask() — Déplacement entre colonnes
```js
async function moveTask(taskId, newColId) {
    await authFetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ id_col: newColId })
    });
    fetchTasks();
}
```
Envoie seulement `{ id_col: newColId }`. Le backend met à jour dynamiquement uniquement ce champ (grâce à la requête UPDATE dynamique).

---

## 12. FRONTEND — js/columns.js {#columns-front}

### addNewColumn()
```js
const title = prompt("Quel nom pour la nouvelle colonne ?");
if (title && title.trim()) {
    const res = await authFetch('http://localhost:3000/api/columns', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() })
    });
    fetchTasks();
}
```
`prompt()` = boîte de dialogue native du navigateur.
`.trim()` = supprime les espaces en début/fin de chaîne.
Après création → `fetchTasks()` recharge tout le tableau.

---

## 13. FRONTEND — js/ui.js {#ui-front}

### setupEventListeners()
Attache tous les handlers d'événements (bouton +, fermer modal, logout).
**Principe de séparation des responsabilités** : les listeners sont centralisés ici, pas éparpillés partout.

### Déconnexion
```js
logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
};
```
Vide tout le localStorage (supprime token + user) puis redirige. Le JWT reste techniquement valide 24h sur le serveur, mais le client n'a plus accès.

**Amélioration possible :** Invalider le token côté serveur (liste noire de tokens révoqués). Non implémenté ici car ça nécessite une table BDD supplémentaire.

### resetTaskForm()
```js
function resetTaskForm() {
    form.reset();
    document.getElementById('task-id').value = "";
    document.getElementById('delete-task-btn').style.display = "none";
}
```
Vide le formulaire et cache le bouton "Supprimer" (il n'y a rien à supprimer pour une nouvelle tâche).

---

## 14. FRONTEND — js/team.js {#team-front}

### showTeam() — Affichage de l'équipe
```js
const response = await authFetch('http://localhost:3000/api/users');
const users = await response.json();

area.innerHTML = `
    <table>
        <tbody>
            ${users.map(u => `
                <tr>
                    <td>${escapeHTML(u.name)}</td>
                    <td>${escapeHTML(u.email)}</td>
                    <td><span class="badge">${escapeHTML(u.role)}</span></td>
                    <td><span onclick="deleteUser(${u.id})">🗑️</span></td>
                </tr>
            `).join('')}
        </tbody>
    </table>
`;
```
Note : `escapeHTML` utilisé sur chaque donnée affichée. `deleteUser(${u.id})` passe l'ID numérique directement → pas de risque XSS car c'est un entier.

---

## 15. FRONTEND — js/profile.js {#profile-front}

### showProfile() — Depuis localStorage
```js
const user = JSON.parse(localStorage.getItem('user'));
document.getElementById('profile-info-content').innerHTML = `
    <h2>${escapeHTML(user.name)}</h2>
    <tr><th>Email</th><td>${escapeHTML(user.email)}</td></tr>
    <tr><th>Rôle</th><td>${escapeHTML(user.role)}</td></tr>
`;
```
Les données viennent du **localStorage** (stockées au login), **pas** d'une requête API. Donc elles ne se mettent pas à jour automatiquement si un admin modifie votre profil.

**Avantage :** Rapide, pas de requête réseau.
**Inconvénient :** Données potentiellement obsolètes.

---

## 16. BASE DE DONNÉES — schema.sql {#bdd}

### Table users
```sql
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,   -- Contrainte d'unicité
    password VARCHAR(255) NOT NULL,        -- Haché par bcrypt
    role ENUM('admin', 'user') DEFAULT 'user',
    avatar VARCHAR(255) DEFAULT 'default.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table tasks avec clés étrangères
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

**Différence SET NULL vs CASCADE :**
- `id_assigned ... ON DELETE SET NULL` : si l'utilisateur est supprimé, la tâche reste mais `id_assigned` = NULL
- `id_col ... ON DELETE CASCADE` : si la colonne est supprimée, toutes ses tâches sont supprimées aussi

### Cardinalités
- `users` 1 ──< `tasks` : un user peut avoir plusieurs tâches assignées
- `columns` 1 ──< `tasks` : une colonne peut contenir plusieurs tâches
- `tasks` >── 1 `users` : une tâche est assignée à un seul user (ou aucun)
- `tasks` >── 1 `columns` : une tâche est dans une seule colonne

---

## RÉSUMÉ DES CODES HTTP UTILISÉS

| Code | Signification | Où dans Lumina |
|------|--------------|----------------|
| 200 OK | Succès | GET tasks, PUT tasks, DELETE |
| 201 Created | Ressource créée | POST /register, POST /tasks |
| 400 Bad Request | Données invalides | Titre manquant |
| 401 Unauthorized | Token manquant | verifyToken |
| 403 Forbidden | Token invalide/expiré | verifyToken |
| 500 Internal Server Error | Erreur BDD | Toutes les routes |

---

## RÉSUMÉ DES MÉTHODES HTTP (REST)

| Méthode | Action | Idempotent? | Exemple Lumina |
|---------|--------|-------------|----------------|
| GET | Lire | Oui | GET /api/tasks |
| POST | Créer | Non | POST /api/tasks |
| PUT | Modifier tout | Oui | PUT /api/tasks/5 |
| PATCH | Modifier partiel | Oui | Non utilisé |
| DELETE | Supprimer | Oui | DELETE /api/tasks/5 |

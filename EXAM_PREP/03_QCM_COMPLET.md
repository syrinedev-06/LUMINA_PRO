# QCM COMPLET — LUMINA PRO
## ~150 questions avec réponses détaillées

---

## PARTIE 1 — ARCHITECTURE & JAVASCRIPT FONDAMENTAUX

---

**Q1. Qu'est-ce que `async/await` en JavaScript ?**

**R :** `async/await` est une syntaxe pour gérer l'asynchronisme de façon lisible. `async` déclare qu'une fonction retourne une Promise. `await` met en pause l'exécution jusqu'à ce que la Promise soit résolue, sans bloquer le reste du navigateur. Dans Lumina, on l'utilise dans toutes les fonctions qui appellent l'API (`fetchTasks`, `handleTaskSubmit`, etc.).

---

**Q2. Que se passe-t-il si on retire `await` devant `authFetch()` dans `fetchTasks()` ?**

**R :** Sans `await`, la variable `columns` contient une Promise non résolue (pas les données). Quand on appelle `.json()` sur une Promise, ça plante. Le kanban ne s'affiche pas et une erreur apparaît dans la console.

---

**Q3. Quelle est la différence entre `localStorage` et `sessionStorage` ?**

**R :**
- `localStorage` : persistant, survit à la fermeture du navigateur. Lumina l'utilise pour stocker le token JWT et les infos utilisateur.
- `sessionStorage` : effacé quand l'onglet est fermé.
- Les deux sont accessibles en JavaScript → vulnérables au XSS.
- Alternative plus sûre : cookies `HttpOnly` (non lisibles par JS).

---

**Q4. Pourquoi `e.preventDefault()` est-il nécessaire dans `loginForm.onsubmit` ?**

**R :** Sans `preventDefault()`, le navigateur envoie le formulaire de façon classique (rechargement de page avec paramètres dans l'URL). Cela interrompt la requête `fetch` et vide la page. `preventDefault()` empêche ce comportement par défaut et laisse notre code `fetch` gérer l'envoi.

---

**Q5. Que fait `.filter()` dans `renderBoard()` ?**

**R :** `.filter(t => t.id_col === col.id)` parcourt le tableau de toutes les tâches et ne retourne que celles dont `id_col` correspond à l'ID de la colonne courante. C'est ainsi qu'on répartit les tâches dans leurs colonnes respectives.

---

**Q6. Quelle est la différence entre `.map()` et `.forEach()` ?**

**R :**
- `.map()` retourne un **nouveau tableau** transformé. Dans Lumina, on l'utilise pour transformer chaque tâche en chaîne HTML.
- `.forEach()` exécute une action pour chaque élément mais **ne retourne rien**. On l'utilise dans `renderBoard()` pour parcourir les colonnes.

---

**Q7. Pourquoi utilise-t-on `.join('')` après `.map()` dans `renderBoard()` ?**

**R :** `.map()` retourne un tableau de chaînes HTML (`["<div>tâche1</div>", "<div>tâche2</div>"]`). `.join('')` les colle en une seule chaîne sans séparateur, prête à être injectée dans `innerHTML`.

---

**Q8. Que sont les template literals (backticks) ?**

**R :** Les template literals sont des chaînes délimitées par des backticks (`` ` ``) qui permettent :
- L'interpolation de variables : `${variable}`
- Les chaînes multilignes sans `\n`
- Des expressions JavaScript dans les chaînes
Dans Lumina, on les utilise massivement pour générer le HTML du kanban.

---

**Q9. Quelle est la différence entre `==` et `===` en JavaScript ?**

**R :**
- `==` : égalité avec conversion de type (`"5" == 5` → `true`)
- `===` : égalité stricte, sans conversion (`"5" === 5` → `false`)
Dans Lumina, on utilise `===` pour comparer les IDs de colonnes dans `.filter()`.

---

**Q10. Qu'est-ce que `DOMContentLoaded` ?**

**R :** C'est un événement qui se déclenche quand le HTML est complètement analysé par le navigateur (sans attendre les images et CSS). On l'utilise dans `js/auth.js` et `js/kanban.js` pour s'assurer que les éléments HTML existent avant d'essayer d'y attacher des événements.

---

## PARTIE 2 — FETCH API & HTTP

---

**Q11. Quelles sont les 4 méthodes HTTP principales utilisées dans Lumina et leur rôle ?**

**R :**
- `GET` : lire des données (ex: récupérer les tâches)
- `POST` : créer une ressource (ex: créer une tâche, s'inscrire)
- `PUT` : modifier une ressource (ex: modifier ou déplacer une tâche)
- `DELETE` : supprimer une ressource (ex: supprimer une tâche)

---

**Q12. Quelle est la différence entre `POST` et `PUT` ?**

**R :**
- `POST` : crée une nouvelle ressource. Pas idempotent (deux POST identiques créent deux ressources).
- `PUT` : modifie une ressource existante à une URL précise. Idempotent (deux PUT identiques donnent le même résultat).
Dans Lumina, `handleTaskSubmit()` choisit automatiquement entre les deux selon la présence d'un ID.

---

**Q13. Que signifient les codes HTTP 200, 201, 400, 401, 403, 500 ?**

**R :**
- `200 OK` : succès (GET, PUT, DELETE)
- `201 Created` : ressource créée (POST /register, POST /tasks)
- `400 Bad Request` : données invalides (titre manquant)
- `401 Unauthorized` : non authentifié (token manquant)
- `403 Forbidden` : authentifié mais pas autorisé (token invalide/expiré)
- `500 Internal Server Error` : erreur côté serveur (bug SQL, etc.)

---

**Q14. Que contient l'en-tête `Authorization` dans les requêtes de Lumina ?**

**R :** `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
Le préfixe `Bearer` est un standard (RFC 6750). Suivi du token JWT. `authFetch()` ajoute automatiquement cet en-tête à chaque requête protégée en lisant le token dans `localStorage`.

---

**Q15. Quelle est la différence entre un en-tête et un body dans une requête HTTP ?**

**R :**
- **En-têtes (Headers)** : métadonnées de la requête (type de contenu, authentification, etc.). Dans Lumina : `Content-Type: application/json` et `Authorization: Bearer ...`
- **Body (corps)** : les données envoyées, seulement pour POST/PUT. Dans Lumina : `JSON.stringify({ title, description, ... })`
Les requêtes GET et DELETE n'ont généralement pas de body.

---

**Q16. Pourquoi doit-on préciser `Content-Type: application/json` ?**

**R :** Cet en-tête dit au serveur "le body que j'envoie est du JSON". Sans lui, Express ne sait pas comment parser le body et `req.body` sera `undefined`. Le middleware `express.json()` dans `server.js` ne traite que les requêtes avec ce Content-Type.

---

**Q17. Que fait `JSON.stringify()` et `JSON.parse()` ?**

**R :**
- `JSON.stringify(objet)` : convertit un objet JavaScript en chaîne JSON → `'{"title":"Ma tâche"}'`. Utilisé pour envoyer des données via `fetch`.
- `JSON.parse(chaîne)` : convertit une chaîne JSON en objet JavaScript → `{ title: "Ma tâche" }`. Utilisé pour lire le localStorage (`JSON.parse(localStorage.getItem('user'))`).

---

**Q18. Que se passe-t-il si le serveur Node.js est éteint et qu'on charge le kanban ?**

**R :** `authFetch()` va déclencher une erreur réseau (la connexion est refusée). Le `catch` dans `fetchTasks()` l'attrape et affiche un message rouge : `"Impossible de se connecter au serveur. Est-il allumé ?"`. Sans `try/catch`, l'application crasherait silencieusement.

---

**Q19. Quelle est la différence entre CORS et l'en-tête Authorization ?**

**R :**
- **CORS** : politique du navigateur qui bloque les requêtes cross-origin (différentes origines). `app.use(cors())` dans `server.js` autorise toutes les origines. Sans ça : "Blocked by CORS policy" dans la console.
- **Authorization** : mécanisme d'authentification, vérifie que l'utilisateur est connecté. Ce sont deux choses distinctes.

---

**Q20. Pourquoi l'API de Lumina retourne-t-elle du JSON ?**

**R :** JSON (JavaScript Object Notation) est le format d'échange standard des API REST. Il est :
- Lisible par les humains
- Nativement pris en charge par JavaScript (`.json()`, `JSON.stringify()`)
- Léger (moins verbeux que XML)
- Interprétable par n'importe quel langage de programmation

---

## PARTIE 3 — JWT & AUTHENTIFICATION

---

**Q21. Qu'est-ce qu'un JWT (JSON Web Token) ?**

**R :** Un JWT est un token de session en 3 parties séparées par des points :
1. **Header** : algorithme utilisé (`HS256`)
2. **Payload** : données publiques (`{ id: 1, role: "admin", exp: ... }`)
3. **Signature** : HMAC-SHA256 du header + payload avec la clé secrète

Il permet au serveur de vérifier l'identité de l'utilisateur sans session en BDD.

---

**Q22. Quelle est la différence entre un JWT et une session classique ?**

**R :**
- **Session classique** : le serveur stocke un ID de session en BDD/mémoire. Le navigateur envoie un cookie avec cet ID. Le serveur vérifie en BDD à chaque requête.
- **JWT** : tout est dans le token. Le serveur vérifie juste la signature cryptographique. Pas de BDD nécessaire → plus scalable.
Lumina utilise JWT. Arte Facto utilise les sessions Laravel classiques.

---

**Q23. Pourquoi le payload d'un JWT est-il visible mais pas falsifiable ?**

**R :** Le payload est encodé en Base64URL (pas chiffré) → visible. Mais la **signature** est calculée avec la clé secrète. Si quelqu'un modifie le payload et tente de réenvoyer le token, `jwt.verify()` détecte que la signature ne correspond plus → token rejeté. Sans connaître `SECRET_KEY`, impossible de forger un token valide.

---

**Q24. Que se passe-t-il si le JWT expire ?**

**R :** `jwt.verify()` dans `verifyToken` lève une erreur `TokenExpiredError` → le `catch` retourne `403 Forbidden`. Côté client, `authFetch()` reçoit un 401/403 et redirige vers `login.html` après avoir vidé le `localStorage`. L'utilisateur doit se reconnecter.

---

**Q25. Pourquoi ne jamais mettre le mot de passe dans le payload JWT ?**

**R :** Le payload est décodable par n'importe qui (Base64URL). Si le token est volé (via XSS), le mot de passe serait exposé. Le payload ne doit contenir que des données non sensibles nécessaires au fonctionnement (ici : `id` et `role`).

---

**Q26. Que fait `jwt.sign()` et `jwt.verify()` ?**

**R :**
- `jwt.sign(payload, secret, options)` : crée un token signé. Options : `{ expiresIn: '24h' }`.
- `jwt.verify(token, secret)` : vérifie la signature et l'expiration. Retourne le payload si valide, lève une exception sinon.

---

**Q27. Pourquoi `SECRET_KEY` devrait-elle être dans un fichier `.env` ?**

**R :** Si `SECRET_KEY` est dans le code source et le code est pushé sur GitHub → n'importe qui peut générer de faux tokens valides et usurper n'importe quel compte. Dans un `.env` :
- Non versionné (`.gitignore` l'exclut)
- Différent en dev, staging et prod
- Chargé via `require('dotenv').config()` en Node.js

---

**Q28. Que se passe-t-il si on supprime le middleware `verifyToken` de `server.js` ?**

**R :** Toutes les routes protégées (`/api/tasks`, `/api/columns`, `/api/users`) deviennent publiques. N'importe qui, sans être connecté, peut lire, créer, modifier et supprimer toutes les données. L'API est complètement ouverte.

---

**Q29. Quelle est la différence entre 401 et 403 dans `verifyToken` ?**

**R :**
- **401** : renvoyé quand `Authorization` est absent ou mal formaté → "qui êtes-vous ?"
- **403** : renvoyé quand le token est présent mais invalide ou expiré → "votre badge n'est plus valide"

---

**Q30. Que contient `req.user` après `verifyToken` ?**

**R :** `req.user = { id: 1, role: "admin", iat: 1234567890, exp: 1234654290 }`
- `id` : ID de l'utilisateur en BDD
- `role` : "admin" ou "user"
- `iat` : issued at (timestamp de création)
- `exp` : timestamp d'expiration
Les routes suivantes peuvent utiliser `req.user.id` pour savoir qui fait la requête.

---

## PARTIE 4 — BCRYPT & SÉCURITÉ DES MOTS DE PASSE

---

**Q31. Quelle est la différence entre hachage et chiffrement ?**

**R :**
- **Hachage** : transformation à sens unique, irréversible. On ne peut jamais retrouver l'original. Utilisé pour les mots de passe. Exemples : bcrypt, SHA-256, Argon2.
- **Chiffrement** : réversible avec une clé. On peut déchiffrer. Utilisé pour les données à transmettre. Exemples : AES, RSA.

Pour les mots de passe, on hache car on n'a jamais besoin de "voir" le mot de passe original — on vérifie juste s'il correspond.

---

**Q32. Que fait `bcrypt.hash(password, 10)` ?**

**R :**
1. Génère un **sel** aléatoire (chaîne unique)
2. Ajoute ce sel au mot de passe
3. Applique l'algorithme Blowfish 2^10 = 1024 fois
4. Retourne `$2b$10$[sel][hash]` (72 caractères)

Le `10` est le "cost factor" : plus il est élevé, plus c'est lent → plus difficile à bruteforcer.

---

**Q33. Comment `bcrypt.compare()` fonctionne-t-il ?**

**R :** `bcrypt.compare(motDePasseSaisi, hashStocké)` :
1. Extrait le sel du hash stocké (il est dans les premiers caractères)
2. Hache le mot de passe saisi avec ce même sel
3. Compare les deux hash caractère par caractère de façon à **résistance aux attaques temporelles**
4. Retourne `true` ou `false`

---

**Q34. Pourquoi ne jamais stocker les mots de passe en clair ?**

**R :** Si la base de données est compromise (SQL injection, accès serveur non autorisé), tous les mots de passe seraient visibles. Comme beaucoup de gens réutilisent leurs mots de passe sur plusieurs sites, ce serait catastrophique. Avec bcrypt, même si la BDD est volée, les mots de passe restent illisibles.

---

**Q35. Pourquoi ne pas utiliser MD5 ou SHA-1 pour les mots de passe ?**

**R :** MD5 et SHA-1 sont des fonctions de hachage **rapides** → on peut calculer des milliards de hashes par seconde avec un GPU → attaques par dictionnaire et rainbow tables efficaces. bcrypt est intentionnellement **lent** → même avec un GPU puissant, le bruteforce est pratiquement impossible.

---

**Q36. Qu'est-ce qu'un "sel" (salt) dans bcrypt ?**

**R :** Le sel est une valeur aléatoire unique générée pour chaque mot de passe. Il est ajouté avant le hachage. Cela garantit que deux utilisateurs avec le même mot de passe auront des hashes différents → les **rainbow tables** (tables de hashes précalculés) deviennent inutiles.

---

## PARTIE 5 — BASE DE DONNÉES SQL

---

**Q37. Qu'est-ce qu'une clé primaire (PRIMARY KEY) ?**

**R :** Identifiant unique d'une ligne dans une table. Dans Lumina : `id INT AUTO_INCREMENT PRIMARY KEY`. `AUTO_INCREMENT` génère automatiquement une valeur unique croissante à chaque insertion. Garantit qu'aucune ligne n'a le même ID.

---

**Q38. Qu'est-ce qu'une clé étrangère (FOREIGN KEY) ?**

**R :** Référence l'ID d'une ligne dans une autre table. Dans Lumina :
- `id_col` dans `tasks` → référence `columns(id)`
- `id_assigned` dans `tasks` → référence `users(id)`

Garantit l'**intégrité référentielle** : impossible d'assigner une tâche à un utilisateur qui n'existe pas.

---

**Q39. Quelle est la différence entre `ON DELETE CASCADE` et `ON DELETE SET NULL` dans Lumina ?**

**R :**
- `id_col REFERENCES columns(id) ON DELETE CASCADE` : si la colonne est supprimée → toutes ses tâches sont supprimées automatiquement
- `id_assigned REFERENCES users(id) ON DELETE SET NULL` : si l'utilisateur est supprimé → les tâches restent mais `id_assigned` devient `NULL` (tâche non assignée)

---

**Q40. Pourquoi utilise-t-on `LEFT JOIN` au lieu de `INNER JOIN` dans la route GET /api/tasks ?**

**R :**
- `INNER JOIN` : ne retourne que les lignes où la condition est vraie des deux côtés → les tâches non assignées (`id_assigned = NULL`) disparaîtraient.
- `LEFT JOIN` : retourne TOUTES les lignes de la table gauche (`tasks`), même si la jointure ne correspond à rien → les tâches non assignées apparaissent avec `assigned_name = NULL`.

---

**Q41. Qu'est-ce qu'une requête préparée et pourquoi protège-t-elle contre l'injection SQL ?**

**R :** Dans une requête préparée, les données utilisateur sont passées séparément des instructions SQL :
```sql
SELECT * FROM users WHERE email = ?
```
Le `?` est un placeholder. Le driver MySQL échappe automatiquement les valeurs. Un email malveillant comme `' OR '1'='1` devient une chaîne littérale inoffensive, pas une instruction SQL.

---

**Q42. Que fait `SELECT MAX(position) FROM columns` ?**

**R :** `MAX()` est une fonction d'agrégation qui retourne la valeur maximale de la colonne `position`. Utilisée dans `routes/columns.js` pour calculer la position de la nouvelle colonne (MAX + 1). Si la table est vide, `MAX()` retourne `NULL` → `(null || 0) + 1 = 1`.

---

**Q43. Pourquoi `ORDER BY position ASC` est-il important pour les colonnes ?**

**R :** Sans tri, MySQL peut retourner les colonnes dans un ordre arbitraire (ordre d'insertion, index interne). `ORDER BY position ASC` garantit que le kanban affiche toujours les colonnes de gauche à droite dans l'ordre correct, indépendamment de l'ordre en BDD.

---

**Q44. Que signifie `ENUM('high', 'medium', 'low')` dans la table tasks ?**

**R :** `ENUM` est un type MySQL qui restreint les valeurs possibles à une liste définie. Si on tente d'insérer `priority = 'critique'`, MySQL rejette la valeur. Ça garantit l'intégrité des données. `DEFAULT 'medium'` définit la valeur utilisée si aucune priorité n'est précisée.

---

**Q45. Quelle est la différence entre `VARCHAR(255)` et `TEXT` ?**

**R :**
- `VARCHAR(n)` : chaîne de longueur variable, max `n` caractères. Optimisé pour les courtes chaînes. Utilisé pour `title`, `email`, `name`.
- `TEXT` : texte de longueur arbitraire (jusqu'à 65535 caractères). Utilisé pour `description` car elle peut être longue.

---

**Q46. Qu'est-ce que `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` ?**

**R :** `TIMESTAMP` est un type MySQL qui stocke date + heure. `DEFAULT CURRENT_TIMESTAMP` signifie que si on n'insère pas de valeur pour ce champ, MySQL insère automatiquement la date/heure courante. Dans Lumina : `created_at` dans `tasks` et `users`.

---

**Q47. Que se passe-t-il si on supprime `ON DELETE CASCADE` de la clé étrangère `id_col` ?**

**R :** Si on supprime une colonne, MySQL lève une erreur de contrainte de clé étrangère car des tâches ont encore `id_col` pointant vers la colonne supprimée. La suppression de la colonne échouerait — à moins de supprimer manuellement toutes ses tâches avant dans la route DELETE.

---

**Q48. Pourquoi ne jamais faire `SELECT *` sur la table `users` ?**

**R :** `SELECT *` retournerait aussi le champ `password` (haché mais quand même sensible). Si la réponse JSON est interceptée ou logguée, le hash bcrypt est exposé. Dans Lumina, `routes/users.js` fait `SELECT id, name, email, role FROM users` — projection explicite.

---

**Q49. Qu'est-ce que `req.params.id` dans `router.delete('/:id', ...)` ?**

**R :** `:id` est un paramètre de route dynamique dans Express. Dans l'URL `DELETE /api/tasks/5`, `req.params.id` vaut `"5"` (chaîne). On passe cette valeur dans la requête SQL préparée pour supprimer la bonne tâche.

---

**Q50. Comment fonctionne `sql.slice(0, -2)` dans la route PUT tasks ?**

**R :** La construction dynamique de la requête ajoute `", "` après chaque champ. Après la dernière condition, la requête ressemble à `"UPDATE tasks SET title = ?, id_col = ?, "`. `.slice(0, -2)` supprime les 2 derniers caractères (`", "`) pour avoir une requête SQL valide avant d'ajouter `WHERE id = ?`.

---

## PARTIE 6 — NODE.JS & EXPRESS

---

**Q51. Qu'est-ce qu'Express.js ?**

**R :** Framework web minimaliste pour Node.js. Simplifie la création de serveurs HTTP et d'APIs REST. Gère le routing, les middlewares et les réponses. Dans Lumina : `const app = express()`.

---

**Q52. Qu'est-ce qu'un middleware Express ?**

**R :** Fonction qui s'exécute entre la réception d'une requête et l'envoi de la réponse. Reçoit `(req, res, next)`. Si `next()` est appelé, la requête passe au middleware/route suivant. Exemples dans Lumina : `express.json()`, `cors()`, `verifyToken`, l'injection de `req.db`.

---

**Q53. Dans quel ordre les middlewares s'exécutent-ils ?**

**R :** Dans l'ordre où ils sont déclarés avec `app.use()`. Dans `server.js` :
1. `cors()` → autorise les origins
2. `express.json()` → parse le body JSON
3. Injection `req.db` → attache la connexion BDD
4. `verifyToken` (sur routes protégées) → vérifie le JWT
5. La route elle-même → exécute la logique métier

---

**Q54. Que fait `app.use('/api/tasks', verifyToken, require('./routes/tasks'))` ?**

**R :** Pour toute requête vers `/api/tasks/*` :
1. `verifyToken` s'exécute d'abord → si invalide, retourne 401/403 et s'arrête
2. Si valide, passe au routeur `routes/tasks.js`
3. Le routeur matche la sous-route (GET `/`, POST `/`, PUT `/:id`, DELETE `/:id`)

---

**Q55. Quelle est la différence entre `app.use()` et `app.get()` ?**

**R :**
- `app.use()` : correspond à toutes les méthodes HTTP et tous les chemins commençant par le préfixe donné. Utilisé pour les middlewares et les routeurs.
- `app.get('/route', handler)` : correspond uniquement aux requêtes GET vers `/route`.
Dans Lumina, on utilise `app.use()` pour monter les routeurs sur des préfixes.

---

**Q56. Que fait `module.exports = router` dans les fichiers de routes ?**

**R :** `module.exports` est le mécanisme de Node.js pour exporter un module. `require('./routes/tasks')` dans `server.js` reçoit ce routeur et peut l'utiliser. Sans `module.exports`, le `require()` retournerait un objet vide.

---

**Q57. Qu'est-ce que CORS et pourquoi est-il nécessaire ?**

**R :** CORS (Cross-Origin Resource Sharing) est une politique de sécurité du navigateur. Par défaut, un script sur `http://localhost` ne peut pas faire de requêtes vers `http://localhost:3000` (port différent = origine différente). Le serveur Express doit envoyer l'en-tête `Access-Control-Allow-Origin: *` pour l'autoriser. `app.use(cors())` fait ça automatiquement.

---

**Q58. Que se passe-t-il si on retire `app.use(express.json())` ?**

**R :** `req.body` sera `undefined` pour toutes les requêtes POST/PUT qui envoient du JSON. Les routes qui tentent de lire `req.body.title` ou `req.body.email` retourneront des erreurs car on ne peut pas lire des propriétés d'`undefined`.

---

## PARTIE 7 — SÉCURITÉ WEB (OWASP)

---

**Q59. Qu'est-ce qu'une injection SQL ?**

**R :** Attaque où un utilisateur malveillant injecte du code SQL dans un formulaire. Exemple :
```
Email saisi : admin@lumina.com' OR '1'='1
```
Sans requêtes préparées, la requête devient :
```sql
SELECT * FROM users WHERE email = 'admin@lumina.com' OR '1'='1'
```
Cette condition est toujours vraie → accès à tous les comptes. Lumina s'en protège avec les `?` placeholders.

---

**Q60. Qu'est-ce qu'une faille XSS (Cross-Site Scripting) ?**

**R :** Attaque où un utilisateur injecte du code JavaScript dans le contenu d'une page. Si le titre d'une tâche est `<script>alert('piraté')</script>` et qu'on l'insère directement dans `innerHTML` sans `escapeHTML()`, ce script s'exécuterait dans le navigateur de tous les visiteurs.

Lumina se protège avec `escapeHTML()` qui convertit `<` en `&lt;`, etc.

---

**Q61. Qu'est-ce qu'une attaque CSRF ?**

**R :** Cross-Site Request Forgery. Un site malveillant force le navigateur d'un utilisateur connecté à envoyer une requête à Lumina à son insu (ex: cliquer sur un lien qui supprime toutes les tâches).

Lumina est partiellement protégé car les requêtes API nécessitent le token JWT dans le header `Authorization`. Or les requêtes cross-origin ne peuvent pas lire le `localStorage` ni ajouter des headers custom → le token ne peut pas être volé par CSRF.

---

**Q62. Quelle est la différence entre authentification et autorisation ?**

**R :**
- **Authentification** : "Qui êtes-vous ?" → vérification de l'identité (login/password → JWT)
- **Autorisation** : "Avez-vous le droit ?" → vérification des permissions (rôle admin pour voir l'équipe)

Dans Lumina : `verifyToken` = authentification. La vérification `if (user.role === 'admin')` = autorisation.

---

**Q63. Pourquoi cacher l'onglet "Équipe" côté frontend ne suffit pas comme sécurité ?**

**R :** N'importe qui peut :
1. Ouvrir les DevTools
2. Modifier le `localStorage` pour mettre `role: "admin"`
3. Ou appeler directement `GET http://localhost:3000/api/users` depuis Postman sans passer par l'interface

La vraie sécurité est côté serveur. `verifyToken` vérifie le JWT à chaque requête. Un renforcement serait d'ajouter `if (req.user.role !== 'admin') return res.status(403)...` dans la route `/api/users`.

---

**Q64. Qu'est-ce que le principe du "moindre privilège" ?**

**R :** N'accorder à chaque utilisateur que les permissions strictement nécessaires à son rôle. Dans Lumina : un utilisateur normal ne devrait pas pouvoir supprimer d'autres utilisateurs. Un admin peut tout faire. En production, on vérifierait `req.user.role === 'admin'` dans les routes sensibles.

---

**Q65. Que sont les headers `HttpOnly` et `SameSite` pour les cookies ?**

**R :**
- **HttpOnly** : le cookie n'est pas accessible via JavaScript (`document.cookie`). Protège contre le vol de session via XSS.
- **SameSite=Strict/Lax** : le cookie n'est pas envoyé dans les requêtes cross-site. Protège contre CSRF.
Lumina utilise `localStorage` (pas de cookies) → moins protégé contre XSS, mais plus simple à implémenter.

---

## PARTIE 8 — ARCHITECTURE & PATTERNS

---

**Q66. Qu'est-ce que l'architecture MVC ?**

**R :** Model-View-Controller :
- **Model** : gère les données et la logique métier (dans Lumina : les routes + requêtes SQL)
- **View** : affichage (dans Lumina : le HTML généré côté client)
- **Controller** : logique entre model et view (dans Lumina : fonctions JS comme `renderBoard`, `handleTaskSubmit`)

---

**Q67. Qu'est-ce qu'une API REST ?**

**R :** API qui respecte des conventions :
1. Ressources identifiées par des URLs (`/api/tasks`, `/api/tasks/5`)
2. Opérations via méthodes HTTP (GET, POST, PUT, DELETE)
3. Sans état (stateless) : chaque requête contient toutes les infos nécessaires (le JWT)
4. Réponses en JSON
5. Codes HTTP sémantiques

---

**Q68. Pourquoi Lumina divise-t-il le JS en 8 fichiers (`api.js`, `auth.js`, etc.) ?**

**R :** Principe de **séparation des responsabilités** (SoC). Chaque fichier a un rôle précis :
- `api.js` : utilitaires partagés (escapeHTML, authFetch)
- `auth.js` : login/register
- `kanban.js` : affichage du tableau
- `tasks.js` : CRUD tâches
- etc.

Avantages : maintenabilité, lisibilité, possibilité de modifier une partie sans impacter les autres.

---

**Q69. Qu'est-ce que le principe DRY (Don't Repeat Yourself) ?**

**R :** Ne pas dupliquer le code. Dans Lumina, `authFetch()` est un exemple de DRY : au lieu de réécrire `Authorization: Bearer ${token}` dans chaque `fetch()`, on centralise cette logique dans une fonction. Si le format du token change, on ne le modifie qu'à un seul endroit.

---

**Q70. Qu'est-ce que Swagger et pourquoi est-il utilisé dans Lumina ?**

**R :** Swagger (OpenAPI) est un standard de documentation d'API. `swagger.json` décrit tous les endpoints (URL, méthode, paramètres, réponses). `swagger-ui-express` génère une interface web interactive sur `/api-docs`. Ça permet de :
- Tester l'API depuis le navigateur
- Partager la documentation avec l'équipe front
- Remplacer partiellement Postman

---

## PARTIE 9 — FONCTIONNALITÉS SPÉCIFIQUES DE LUMINA

---

**Q71. Comment fonctionne la création d'une tâche de A à Z ?**

**R :**
1. Clic sur "+" → `resetTaskForm()` → modal s'ouvre
2. Utilisateur remplit le formulaire (titre, desc, priorité, assigné)
3. Clic "Enregistrer" → `handleTaskSubmit(e)` → `e.preventDefault()`
4. Pas d'ID → méthode = POST, URL = `/api/tasks`
5. `authFetch(url, { method: 'POST', body: JSON.stringify(taskData) })`
6. Header JWT ajouté → envoyé au serveur
7. `verifyToken` vérifie le JWT → OK
8. `routes/tasks.js` POST / : valide le titre, cherche la 1ère colonne, insère en BDD, log
9. Répond `201 { message: "Tâche créée!" }`
10. Frontend reçoit → ferme modal → `fetchTasks()` → kanban rechargé

---

**Q72. Comment fonctionne le déplacement d'une tâche ?**

**R :**
1. Clic sur "⬅️" ou "➡️" dans une carte
2. `onclick="moveTask(taskId, colId)"` dans le HTML généré par `renderBoard`
3. `moveTask()` : `authFetch PUT /api/tasks/${taskId}` avec `body: { id_col: newColId }`
4. Backend : requête UPDATE dynamique → `UPDATE tasks SET id_col = ? WHERE id = ?`
5. `fetchTasks()` recharge → la tâche apparaît dans la nouvelle colonne

---

**Q73. Comment fonctionne le renommage d'une colonne ?**

**R :**
1. Clic sur "✏️" dans l'en-tête de colonne
2. `renameColumn(id, currentTitle)` : `prompt()` → saisie du nouveau titre
3. `authFetch PUT /api/columns/${id}` avec `body: { title: newTitle }`
4. Backend : `UPDATE columns SET title = ? WHERE id = ?`
5. `fetchTasks()` recharge → le nouveau titre apparaît

---

**Q74. Pourquoi `fetchTasks()` est appelée après chaque action (créer, modifier, supprimer) ?**

**R :** Pour synchroniser l'affichage avec l'état réel de la BDD. Sans ça, le kanban montrerait des données obsolètes. `fetchTasks()` refait 2 requêtes (colonnes + tâches) et redessine complètement le board. C'est une approche simple mais efficace — une alternative serait de mettre à jour le DOM localement (optimistic update) pour éviter le rechargement complet.

---

**Q75. Pourquoi le profil (`showProfile`) ne fait-il pas de requête API ?**

**R :** Les données de profil (nom, email, rôle, ID) sont stockées dans `localStorage` au moment de la connexion. C'est suffisant pour l'affichage car ces données changent rarement. Avantage : affichage instantané, zéro requête. Inconvénient : si l'admin modifie votre compte, vous verrez l'ancienne version jusqu'à la prochaine connexion.

---

**Q76. Que se passe-t-il côté BDD quand on supprime une colonne qui contient des tâches ?**

**R :** MySQL exécute `DELETE FROM columns WHERE id = 2`. La contrainte `ON DELETE CASCADE` sur `tasks.id_col` déclenche automatiquement `DELETE FROM tasks WHERE id_col = 2`. Les tâches sont supprimées en cascade sans requête supplémentaire côté application.

---

**Q77. Comment Lumina assigne-t-il automatiquement une tâche à la première colonne si aucune n'est précisée ?**

**R :**
```js
const findColSql = "SELECT id FROM columns ORDER BY position ASC LIMIT 1";
req.db.query(findColSql, (err, cols) => {
    const targetCol = id_col || cols[0].id;
    // ...
});
```
`LIMIT 1` retourne seulement la 1ère colonne (position minimale). L'opérateur `||` utilise l'ID fourni si disponible, sinon l'ID de la 1ère colonne.

---

**Q78. Pourquoi la déconnexion dans Lumina ne "révoque-t-elle" pas vraiment le JWT ?**

**R :** `localStorage.clear()` supprime le token du navigateur, mais le JWT reste techniquement valide côté serveur jusqu'à son expiration (24h). Si quelqu'un a sauvegardé le token, il peut encore l'utiliser. Pour révoquer vraiment un token, il faudrait une **blacklist côté serveur** (table en BDD des tokens révoqués) vérifiée dans `verifyToken`.

---

**Q79. Comment l'initialisation des colonnes par défaut fonctionne-t-elle dans `server.js` ?**

**R :** Au démarrage du serveur, après la connexion MySQL :
```js
db.query("SELECT COUNT(*) as count FROM columns", (err, result) => {
    if (!err && result[0].count === 0) {
        db.query("INSERT INTO columns (title, position) VALUES ('À faire', 1), ('En cours', 2), ('Terminé', 3)");
    }
});
```
Si la table `columns` est vide (première exécution), les 3 colonnes sont créées. `IF NOT EXISTS` sur les `CREATE TABLE` + cette vérification rendent l'initialisation **idempotente**.

---

**Q80. Comment `loadUsers()` alimente-t-il la liste déroulante d'assignation ?**

**R :**
```js
async function loadUsers() {
    const response = await authFetch('http://localhost:3000/api/users');
    const users = await response.json();
    const select = document.getElementById('task-assign');
    select.innerHTML = '<option value="">Attribuer à...</option>' +
        users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}
```
Les options du `<select>` sont générées dynamiquement à partir de la liste des utilisateurs en BDD. `value="${u.id}"` stocke l'ID — c'est cet ID qui sera envoyé comme `id_assigned` lors de la soumission.

---

## PARTIE 10 — CSS & RESPONSIVE

---

**Q81. Comment fonctionne le responsive dans Lumina ?**

**R :** Via des **media queries** dans `css/responsive.css`. Ex :
```css
@media (max-width: 900px) {
    .sidebar {
        transform: translateX(-100%);
    }
    .sidebar-toggle {
        display: block;
    }
}
```
La sidebar disparaît sur mobile. Un bouton hamburger apparaît. Clic sur le bouton → `toggleSidebar()` → `sidebar.classList.toggle('open')`.

---

**Q82. Qu'est-ce que les variables CSS (`--primary`) dans `variables.css` ?**

**R :** Variables CSS (custom properties) définies dans `:root {}`. Elles permettent de centraliser les valeurs réutilisables (couleurs, tailles). Modifier `--primary: #d63384` change la couleur partout. Facilitent la maintenance et le thème sombre/clair.

---

**Q83. Pourquoi les CSS sont-ils divisés en plusieurs fichiers dans Lumina ?**

**R :** Pour la lisibilité et la maintenance. `style.css` importe tous les modules avec `@import`. Chaque fichier a une responsabilité :
- `variables.css` : couleurs et polices
- `layout.css` : structure sidebar/main
- `kanban.css` : colonnes et cartes
- `responsive.css` : media queries
- etc.

---

**Q84. Qu'est-ce que le mode sombre dans Lumina et comment est-il géré ?**

**R :** Un toggle dans `login.html` appelle `toggleTheme()` :
```js
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
}
```
L'état est sauvegardé dans `localStorage`. Un script inline dans `<head>` de `login.html` applique la classe `dark-mode` immédiatement au chargement, avant que le CSS soit appliqué → évite le flash de contenu non stylé.

---

## PARTIE 11 — QUESTIONS JURY TYPIQUES

---

**Q85. Qu'est-ce que vous referiez différemment dans Lumina ?**

**R. Exemple de réponse complète :**
- Stocker `SECRET_KEY` dans un fichier `.env` (pas en dur dans le code)
- Ajouter une vérification du rôle côté serveur pour `/api/users` (seulement les admins)
- Utiliser des cookies `HttpOnly` au lieu de `localStorage` pour stocker le JWT → plus sécurisé contre XSS
- Ajouter de la validation des données côté backend (vérifier que le titre n'est pas vide, longueur maximale, etc.)
- Utiliser HTTPS en production (certificat SSL)

---

**Q86. Comment avez-vous géré la sécurité dans Lumina ?**

**R. Réponse structurée :**
1. **Injection SQL** : requêtes préparées avec `?` dans toutes les routes
2. **XSS** : `escapeHTML()` sur tout contenu affiché dans le DOM
3. **Authentification** : JWT signé (HS256) avec expiration 24h
4. **Mots de passe** : hachage bcrypt (10 rounds) — irréversible, salé
5. **CSRF** : protection partielle car le JWT dans le header `Authorization` ne peut pas être lu cross-origin

---

**Q87. Expliquez la différence entre le front-end et le back-end dans Lumina.**

**R :**
- **Front-end** : tout ce qui tourne dans le navigateur. HTML/CSS pour l'affichage, JavaScript pour l'interactivité et les appels API. Fichiers : `login.html`, `index.html`, `css/`, `js/`.
- **Back-end** : le serveur Node.js/Express sur le port 3000. Gère l'authentification, les requêtes SQL, la logique métier. Fichiers : `server.js`, `routes/`, `middleware/`.
Communication : le frontend envoie des requêtes HTTP avec un JWT → le backend répond en JSON.

---

**Q88. Pourquoi avoir choisi Node.js plutôt que PHP pour le back-end ?**

**R. Réponse possible :**
Node.js est basé sur JavaScript, le même langage que le front-end → cohérence dans la stack. Non bloquant grâce à l'event loop → performant pour les I/O multiples. npm offre un large écosystème. Express est léger et flexible. PHP aurait été tout aussi valide (ex: avec Laravel comme Arte Facto).

---

**Q89. Qu'est-ce que le principe "Security by Design" ?**

**R :** Intégrer la sécurité dès la conception, pas en ajout tardif. Dans Lumina :
- Les requêtes préparées sont utilisées dès le premier jour
- `escapeHTML()` est dans `api.js` (partagé par tout le front)
- `verifyToken` est monté sur TOUTES les routes protégées dans `server.js`
Opposé : ajouter des vérifications de sécurité seulement après une attaque.

---

**Q90. Qu'est-ce que l'OWASP Top 10 ? Citez 3 vulnérabilités couvertes dans Lumina.**

**R :** OWASP Top 10 = liste des 10 vulnérabilités web les plus critiques.
1. **A03 Injection** → couverte par les requêtes préparées
2. **A07 XSS** → couverte par `escapeHTML()`
3. **A02 Cryptographic Failures** → couverte par bcrypt (pas de mots de passe en clair)
4. **A01 Broken Access Control** → partiellement couverte par JWT + verifyToken

---

**Q91. Qu'est-ce que les propriétés ACID d'une base de données ?**

**R :**
- **A**tomicité : une transaction réussit complètement ou échoue complètement (pas à moitié)
- **C**ohérence : les données restent dans un état valide avant/après la transaction
- **I**solation : les transactions concurrentes ne s'interfèrent pas
- **D**urabilité : une fois commitées, les données sont persistées même en cas de panne

MySQL (InnoDB) respecte ACID. Exemple dans Lumina : si l'insertion de la tâche réussit mais l'insertion du log échoue → aucun rollback car pas de transaction explicite (point d'amélioration).

---

**Q92. Qu'est-ce que la règle 3-2-1 de sauvegarde ?**

**R :**
- **3** copies des données
- **2** supports différents (disque dur + cloud, par exemple)
- **1** copie hors site (en cas d'incendie, de vol)
Pour Lumina : le code est sur GitHub (2 copies : local + distant). La BDD MySQL devrait être sauvegardée régulièrement avec `mysqldump`.

---

**Q93. Qu'est-ce que le RGPD et comment s'applique-t-il à Lumina ?**

**R :** Règlement Général sur la Protection des Données. Oblige à protéger les données personnelles des utilisateurs européens. Pour Lumina :
- Les mots de passe sont hachés (conformité) ✅
- Les données utilisateur doivent pouvoir être supprimées → `DELETE /api/users/:id` ✅
- Consentement à la collecte de données → pas implémenté
- Politique de confidentialité → pas implémentée
- Durée de conservation des logs → non définie

---

**Q94. Qu'est-ce qu'un MVP (Minimum Viable Product) ?**

**R :** Version minimale d'un produit avec suffisamment de fonctionnalités pour être utilisable et tester les hypothèses clés. Pour Lumina, le MVP = kanban avec colonnes et tâches, authentification JWT, CRUD complet. Les fonctionnalités non MVP (notifications, paiement, historique complet) seraient pour des versions futures.

---

**Q95. Quelle est la différence entre une ESN, une agence web et un annonceur ?**

**R :**
- **ESN** (Entreprise de Services du Numérique) : prestataire de services IT, loue les compétences de ses développeurs à des clients. Ex: Capgemini, Sopra Steria.
- **Agence web** : conçoit et développe des sites/applis pour des clients. Projets courts à moyen terme.
- **Annonceur** : entreprise qui a son équipe de dev en interne pour ses propres produits. Ex: une startup ou grande entreprise.

---

**Q96. Qu'est-ce que la méthode Agile/Scrum ? Comment s'applique-t-elle à Lumina ?**

**R :** Méthode itérative avec des sprints (cycles courts de 1-4 semaines). Chaque sprint délivre un incrément fonctionnel. Cérémonies : Daily standup, Sprint planning, Sprint review, Rétrospective.
Pour Lumina (projet solo) : on peut parler de petites itérations : d'abord l'auth, puis le kanban basique, puis les colonnes dynamiques, puis l'interface équipe, etc.

---

**Q97. Qu'est-ce que Git et comment l'avez-vous utilisé dans Lumina ?**

**R :** Git est un outil de versionnage de code. Il permet de :
- Sauvegarder l'historique des modifications
- Travailler sur des branches séparées
- Revenir à une version précédente
Pour Lumina : dépôt GitHub, commits réguliers, branche `main`. Exemple de message de commit : `"Accentuation du gras pour le nombre de tâches (font-size 13px)"`.

---

**Q98. Qu'est-ce que Swagger et comment le lire ?**

**R :** Interface interactive de documentation d'API. Dans Lumina, accessible sur `http://localhost:3000/api-docs`. Permet de :
- Voir tous les endpoints disponibles
- Tester les requêtes directement depuis le navigateur
- Voir les paramètres attendus et les réponses possibles
Chaque endpoint dans `swagger.json` a : `summary`, `tags`, `requestBody`, `responses`.

---

**Q99. Qu'est-ce qu'un diagramme de séquence ?**

**R :** Diagramme UML qui montre l'ordre des interactions entre composants dans le temps. Exemple pour la connexion dans Lumina :
```
Navigateur → POST /api/auth/login → server.js → verifyToken(non) → auth.js
auth.js → SELECT * FROM users → MySQL → résultat
auth.js → bcrypt.compare() → match ?
auth.js → jwt.sign() → token
auth.js → res.json({ token, user }) → Navigateur
Navigateur → localStorage.setItem('token', token)
Navigateur → redirect → index.html
```

---

**Q100. Comment tester votre API avec Postman ?**

**R :**
1. Créer une requête POST vers `http://localhost:3000/api/auth/login`
2. Body → raw → JSON : `{ "email": "admin@lumina.com", "password": "Lumina1!" }`
3. Envoyer → copier le token JWT reçu
4. Pour les routes protégées → onglet "Authorization" → Type "Bearer Token" → coller le token
5. Tester ex : GET `http://localhost:3000/api/tasks` → voir les tâches JSON

---

## PARTIE 12 — QUESTIONS PIÈGES

---

**Q101. Si on enlève le `||` dans `const targetCol = id_col || cols[0].id`, que se passe-t-il ?**

**R :** Si `id_col` est `undefined` ou `null` (non fourni dans le body), `targetCol` vaudrait `undefined`. La requête SQL recevrait `undefined` comme valeur pour `id_col` → erreur BDD ou insertion avec `NULL` (violerait une contrainte si NOT NULL).

---

**Q102. Dans `verifyToken`, pourquoi `return res.status(401).json(...)` plutôt que juste `res.status(401).json(...)` ?**

**R :** Sans `return`, la fonction continue de s'exécuter après l'envoi de la réponse d'erreur et appellerait `next()` → la route protégée s'exécuterait quand même malgré l'erreur d'authentification. Le `return` stoppe l'exécution du middleware.

---

**Q103. Pourquoi `description !== undefined` (avec `!== undefined`) dans le PUT dynamique ?**

**R :** Si on envoie `{ description: "" }` (description vidée intentionnellement), `description` vaut `""` (falsy). Sans `!== undefined`, la condition `if (description)` serait `false` et la description ne serait pas mise à jour. Avec `!== undefined`, on accepte la valeur vide `""` comme modification valide.

---

**Q104. Que se passe-t-il si deux utilisateurs créent une colonne en même temps ?**

**R :** Les deux exécutent `SELECT MAX(position) FROM columns` → obtiennent la même valeur → calculent la même `nextPos` → deux colonnes avec la même position sont insérées. Le kanban les affichera dans un ordre arbitraire. Problème de **race condition**. Solution : transaction SQL ou générer la position différemment.

---

**Q105. Pourquoi `col.title.replace(/'/g, "\\'")` dans `renderBoard()` ?**

**R :** Quand on génère `onclick="renameColumn(${col.id}, '${col.title}')"`, si le titre contient une apostrophe (ex: `"L'équipe"`), le HTML généré devient `onclick="renameColumn(1, 'L'équipe')"` → erreur de syntaxe JS. `replace(/'/g, "\\'")` échappe les apostrophes : `"L\'équipe"`.

---

**Q106. Que retourne `authFetch()` exactement ?**

**R :** `authFetch()` retourne l'objet `Response` de l'API Fetch (pas les données JSON). Pour obtenir les données, il faut ensuite appeler `await response.json()`. Cet objet contient `response.ok` (true si 200-299), `response.status` (code HTTP), `response.json()` (méthode pour parser le corps).

---

**Q107. Pourquoi `localStorage.getItem('user')` retourne une chaîne et non un objet ?**

**R :** `localStorage` ne stocke que des chaînes. Au login, on stocke `JSON.stringify(data.user)` → `'{"id":1,"name":"Admin","email":"...","role":"admin"}'`. Pour récupérer l'objet, il faut `JSON.parse(localStorage.getItem('user'))`. Si on oublie `JSON.parse`, on manipule une chaîne et `user.name` serait `undefined`.

---

**Q108. Que se passe-t-il si `escapeHTML()` reçoit `null` ou `undefined` ?**

**R :** La première ligne `if (!str) return '';` gère ce cas. `null` et `undefined` sont falsy → la fonction retourne `''` (chaîne vide) au lieu de planter sur `.toString()`. C'est une protection défensive.

---
---

## RÉSUMÉ RAPIDE — MOTS-CLÉS À MAÎTRISER

| Terme | Définition en une phrase |
|-------|--------------------------|
| JWT | Token signé pour authentifier sans session serveur |
| bcrypt | Algorithme de hachage lent pour les mots de passe |
| Middleware | Fonction intermédiaire dans la chaîne de traitement Express |
| REST API | API utilisant les méthodes HTTP et URLs pour CRUD |
| CORS | Politique navigateur autorisant les requêtes cross-origin |
| XSS | Injection de script malveillant dans une page web |
| SQL Injection | Injection de code SQL via des formulaires |
| async/await | Syntaxe pour gérer le code asynchrone lisiblement |
| LEFT JOIN | Jointure SQL qui garde les lignes sans correspondance |
| CASCADE | Suppression en cascade via clé étrangère |
| localStorage | Stockage clé/valeur persistant dans le navigateur |
| escapeHTML | Fonction neutralisant les caractères HTML spéciaux |
| authFetch | Wrapper fetch ajoutant automatiquement le JWT |
| verifyToken | Middleware Express vérifiant chaque JWT entrant |
| Requête préparée | Requête SQL avec `?` pour éviter les injections |
| ACID | Atomicité, Cohérence, Isolation, Durabilité |
| OWASP | Référentiel des 10 vulnérabilités web les plus critiques |
| MVC | Pattern Model-View-Controller |
| RGPD | Réglementation européenne sur la protection des données |
| MVP | Minimum Viable Product — version minimale fonctionnelle |

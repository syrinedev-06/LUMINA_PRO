const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Bibliothèque pour le hachage sécurisé (algorithme Blowfish)
const jwt = require('jsonwebtoken'); // Module pour la génération de tokens de session signés cryptographiquement

// Clé secrète unifiée pour la génération et validation des tokens JWT (voir .env)
const SECRET_KEY = process.env.SECRET_KEY;

/**
 * PROTECTION BRUTE FORCE — Rate Limiting sur le login
 *
 * Problème : sans cette protection, un attaquant peut essayer 100 000 mots de passe
 * automatiquement (attaque par dictionnaire / force brute) sans jamais être bloqué.
 *
 * Solution : on garde en mémoire le nombre de tentatives par adresse IP.
 * Après MAX_ATTEMPTS échecs en moins de WINDOW_MS millisecondes, on bloque pendant
 * BLOCK_MS millisecondes et on répond 429 Too Many Requests.
 *
 * Note : cette implémentation est en mémoire (objet JS). En production, on utiliserait
 * Redis pour persister les compteurs entre plusieurs instances du serveur.
 */
const loginAttempts = {}; // { ip: { count, blockedUntil } }
const MAX_ATTEMPTS = 5;         // Max 5 tentatives ratées
const WINDOW_MS = 15 * 60 * 1000; // Fenêtre de 15 minutes
const BLOCK_MS  = 15 * 60 * 1000; // Blocage de 15 minutes

function checkRateLimit(ip) {
    const now = Date.now();
    if (!loginAttempts[ip]) {
        loginAttempts[ip] = { count: 0, blockedUntil: null };
    }
    const entry = loginAttempts[ip];

    // Si l'IP est actuellement bloquée
    if (entry.blockedUntil && now < entry.blockedUntil) {
        const minutesLeft = Math.ceil((entry.blockedUntil - now) / 60000);
        return { blocked: true, minutesLeft };
    }

    // Si le blocage est passé, on remet à zéro
    if (entry.blockedUntil && now >= entry.blockedUntil) {
        entry.count = 0;
        entry.blockedUntil = null;
    }

    return { blocked: false };
}

function recordFailedAttempt(ip) {
    const now = Date.now();
    if (!loginAttempts[ip]) {
        loginAttempts[ip] = { count: 0, blockedUntil: null };
    }
    loginAttempts[ip].count += 1;
    if (loginAttempts[ip].count >= MAX_ATTEMPTS) {
        loginAttempts[ip].blockedUntil = now + BLOCK_MS;
    }
}

function resetAttempts(ip) {
    delete loginAttempts[ip];
}

/**
 * @brief Route POST pour l'inscription d'un nouvel utilisateur (/api/auth/register).
 * 
 * CONCEPT EXAMEN (Inscription & Sécurité) :
 * 1. **Réception des données** : Le client envoie `name`, `email` et `password` dans le corps (req.body).
 * 2. **Hachage (bcrypt.hash)** : Avant d'insérer le mot de passe en base, il est salé et haché.
 *    Le sel (salt) est une suite aléatoire de caractères ajoutée au mot de passe pour rendre 
 *    les attaques par dictionnaire inefficaces.
 * 3. **Requête préparée** : `db.query(sql, [params])` utilise des placeholders `?`. 
 *    Le pilote MySQL échappe automatiquement les entrées utilisateur pour empêcher les **injections SQL**.
 * 
 * @param {Object} req - Requête Express contenant req.body.name, req.body.email, req.body.password.
 * @param {Object} res - Réponse Express envoyant un statut 201 (Created) ou 500 (Internal Server Error).
 * @returns {void}
 */
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Validation des entrées côté serveur (indispensable même si le formulaire HTML valide aussi)
    // Un attaquant peut envoyer une requête directement à l'API sans passer par le formulaire.
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Nom, email et mot de passe sont obligatoires." });
    }
    // Validation format email avec une expression régulière simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Format d'email invalide." });
    }
    // Mot de passe : minimum 6 caractères
    if (password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    try {
        // Hachage du mot de passe avec un coût algorithmique de 10 (compromis idéal vitesse/sécurité)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Requête d'insertion SQL avec placeholders pour éviter l'injection SQL
        const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

        req.db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                // ER_DUP_ENTRY = contrainte d'unicité violée sur l'email (email déjà pris)
                // HTTP 409 Conflict = la ressource existe déjà, c'est une erreur client, pas serveur
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: "Cet email est déjà utilisé par un autre compte." });
                }
                return res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
            }
            res.status(201).json({ message: "Utilisateur créé avec succès !" });
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur lors du hachage du mot de passe." });
    }
});

/**
 * @brief Route POST pour la connexion utilisateur (/api/auth/login).
 * 
 * CONCEPT EXAMEN (Authentification & JWT) :
 * 1. **Vérification d'existence** : On recherche d'abord si l'email saisi existe en base de données.
 * 2. **Comparaison par hachage (bcrypt.compare)** : Puisque le mot de passe est haché en BDD,
 *    on ne peut pas comparer avec `=` en SQL. `bcrypt.compare` prend le mot de passe en clair saisi
 *    et le compare de manière sécurisée (contre les attaques temporelles) avec le hash enregistré.
 * 3. **Génération de jeton JWT (jwt.sign)** : Si les identifiants sont corrects, on génère un jeton.
 *    - **Payload (Charge utile)** : Contient les données publiques de l'utilisateur (id, role).
 *    - **Signature** : Chiffrée avec la clé secrète pour garantir que le jeton n'a pas été altéré.
 *    - **Expiration** : Le jeton est configuré pour expirer après 24 heures pour limiter les risques en cas de vol.
 * 
 * @param {Object} req - Requête Express contenant req.body.email, req.body.password.
 * @param {Object} res - Réponse Express retournant le jeton JWT et les infos utilisateur de base.
 * @returns {void}
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Récupération de l'IP du client pour le rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Vérification du rate limit AVANT tout traitement
    const rateCheck = checkRateLimit(clientIP);
    if (rateCheck.blocked) {
        return res.status(429).json({
            error: `Trop de tentatives. Réessayez dans ${rateCheck.minutesLeft} minute(s).`
        });
    }

    // A. Recherche de l'utilisateur par son email unique
    const sql = "SELECT * FROM users WHERE email = ?";
    req.db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur serveur de base de données." });

        // Si aucun utilisateur ne possède cet email → échec → comptabiliser la tentative
        if (results.length === 0) {
            recordFailedAttempt(clientIP);
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const user = results[0];

        // B. Vérification du mot de passe saisi par rapport au hash stocké
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Mauvais mot de passe → comptabiliser la tentative ratée
            recordFailedAttempt(clientIP);
            const remaining = MAX_ATTEMPTS - (loginAttempts[clientIP]?.count || 0);
            const msg = remaining > 0
                ? `Email ou mot de passe incorrect. Il vous reste ${remaining} tentative(s).`
                : `Compte temporairement bloqué pendant 15 minutes.`;
            return res.status(401).json({ error: msg });
        }

        // Connexion réussie → remettre le compteur à zéro
        resetAttempts(clientIP);

        // C. Création du Token de session JWT sécurisé
        const token = jwt.sign(
            { id: user.id, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // D. Retour des données au client
        res.json({
            message: "Connexion réussie !",
            token: token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    });
});

module.exports = router;


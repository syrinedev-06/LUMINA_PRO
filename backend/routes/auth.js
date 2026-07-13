const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Bibliothèque pour le hachage sécurisé (algorithme Blowfish)
const jwt = require('jsonwebtoken'); // Module pour la génération de tokens de session signés cryptographiquement

// Clé secrète lue depuis le fichier .env (non versionné) via dotenv.
const SECRET_KEY = process.env.JWT_SECRET || "LUMINA_SECRET_2025_2026";

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

    try {
        // Hachage du mot de passe avec un coût algorithmique de 10 (compromis idéal vitesse/sécurité)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Requête d'insertion SQL avec placeholders pour éviter l'injection SQL
        const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        
        req.db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                // Si une erreur survient (ex: contrainte d'unicité violée sur l'email)
                return res.status(500).json({ 
                    error: "Erreur lors de l'inscription. L'email existe peut-être déjà." 
                });
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

    // A. Recherche de l'utilisateur par son email unique
    const sql = "SELECT * FROM users WHERE email = ?";
    req.db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur serveur de base de données." });
        
        // Si aucun utilisateur ne possède cet email
        if (results.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const user = results[0];

        // B. Vérification du mot de passe saisi par rapport au hash stocké
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        // C. Création du Token de session JWT sécurisé
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            SECRET_KEY, 
            { expiresIn: '24h' }
        );

        // D. Retour des données au client
        // Le client stockera ce token dans le localStorage pour authentifier ses requêtes futures.
        res.json({
            message: "Connexion réussie !",
            token: token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    });
});

module.exports = router;


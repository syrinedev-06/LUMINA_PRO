const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // L'outil pour cacher les mots de passe
const jwt = require('jsonwebtoken'); // L'outil pour créer les badges de connexion

// 1. ROUTE POUR L'INSCRIPTION (Register)
router.post('/register', async (req, res) => {
    // On récupère les données envoyées par l'utilisateur
    const { name, email, password } = req.body;

    try {
        // On mélange (hache) le mot de passe avant de l'enregistrer
        // Le chiffre 10 est la "force" du mélange
        const hashedPassword = await bcrypt.hash(password, 10);

        // On prépare la commande SQL pour insérer l'utilisateur
        const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        
        // On exécute la commande dans la base de données
        // Les [?] sont remplacés par nos variables pour éviter les piratages (Injections SQL)
        req.db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Erreur lors de l'inscription. L'email existe peut-être déjà." });
            }
            res.status(201).json({ message: "Utilisateur créé avec succès !" });
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur lors du hachage." });
    }
});

// 2. ROUTE POUR LA CONNEXION (Login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // A. On cherche l'utilisateur dans la base de données via son email
    const sql = "SELECT * FROM users WHERE email = ?";
    req.db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur serveur" });
        
        // Si on ne trouve pas l'email
        if (results.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const user = results[0];

        // B. On compare le mot de passe tapé avec le mot de passe haché dans la base
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        // C. Si c'est bon, on crée le "Badge" (Token JWT)
        // Ce badge contient l'ID et le rôle de l'utilisateur
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            'SECRET_LUMINA_2024', // C'est la clé secrète pour signer le badge
            { expiresIn: '24h' } // Le badge expire après 24 heures
        );

        // D. On renvoie le badge et les infos de l'utilisateur au site
        res.json({
            message: "Connexion réussie !",
            token: token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    });
});

module.exports = router;

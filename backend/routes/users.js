const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const SECRET_KEY = "LUMINA_SECRET_2024";

// 1. RÉCUPÉRER TOUS LES MEMBRES
router.get('/', (req, res) => {
    const sql = "SELECT id, name, email, role FROM users";
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. INSCRIPTION (Register)
router.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')";
    req.db.query(sql, [name, email, password], (err, result) => {
        if (err) return res.status(500).json({ error: "Email déjà utilisé ou erreur serveur." });
        res.status(201).json({ message: "Utilisateur créé !" });
    });
});

// 3. CONNEXION (Login)
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    
    req.db.query(sql, [email, password], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }
        
        const user = results[0];
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email, // L'email est maintenant BIEN renvoyé
                role: user.role
            }
        });
    });
});

// 4. METTRE À JOUR UN UTILISATEUR (Profil)
router.put('/:id', (req, res) => {
    const { name, email } = req.body;
    const sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
    req.db.query(sql, [name, email, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Profil mis à jour !" });
    });
});

// 5. SUPPRIMER UN UTILISATEUR
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM users WHERE id = ?";
    req.db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Utilisateur supprimé." });
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();

// RÉCUPÉRER TOUTES LES COLONNES
router.get('/', (req, res) => {
    req.db.query("SELECT * FROM columns ORDER BY position ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// AJOUTER UNE NOUVELLE COLONNE
router.post('/', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Le titre est requis" });

    // On récupère la dernière position pour mettre la nouvelle à la fin
    req.db.query("SELECT MAX(position) as maxPos FROM columns", (err, result) => {
        const nextPos = (result[0].maxPos || 0) + 1;
        const sql = "INSERT INTO columns (title, position) VALUES (?, ?)";
        req.db.query(sql, [title, nextPos], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log
            req.db.query("INSERT INTO logs (action, details) VALUES ('Création', ?)", [`Nouvelle colonne "${title}" créée`]);

            res.json({ id: result.insertId, title, position: nextPos });
        });
    });
});

// RENOMMER UNE COLONNE
router.put('/:id', (req, res) => {
    const { title } = req.body;
    const sql = "UPDATE columns SET title = ? WHERE id = ?";
    req.db.query(sql, [title, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Log
        req.db.query("INSERT INTO logs (action, details) VALUES ('Modification', ?)", [`Colonne renommée en "${title}"`]);

        res.json({ message: "Colonne renommée." });
    });
});

// SUPPRIMER UNE COLONNE
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM columns WHERE id = ?";
    req.db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Log
        req.db.query("INSERT INTO logs (action, details) VALUES ('Suppression', 'Une colonne a été supprimée')");

        res.json({ message: "Colonne supprimée." });
    });
});

module.exports = router;

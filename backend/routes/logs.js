const express = require('express');
const router = express.Router();

// RÉCUPÉRER TOUS LES LOGS (Avec plus de limite pour la pagination)
router.get('/', (req, res) => {
    // On enlève la limite de 50 pour pouvoir faire la pagination frontend (ou on met 1000)
    const sql = "SELECT * FROM logs ORDER BY timestamp DESC";
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// SUPPRIMER DES LOGS (plusieurs à la fois)
router.post('/delete', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Aucun ID fourni" });
    }
    const sql = "DELETE FROM logs WHERE id IN (?)";
    req.db.query(sql, [ids], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: result.affectedRows });
    });
});

module.exports = router;

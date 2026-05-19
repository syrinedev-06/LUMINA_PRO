const express = require('express');
const router = express.Router();

// RÉCUPÉRER TOUS LES LOGS NON SUPPRIMÉS (Avec plus de limite pour la pagination)
router.get('/', (req, res) => {
    const sql = "SELECT * FROM logs WHERE is_deleted = 0 ORDER BY timestamp DESC";
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// RÉCUPÉRER TOUS LES LOGS DE LA CORBEILLE (SUPPRIMÉS)
router.get('/trash', (req, res) => {
    const sql = "SELECT * FROM logs WHERE is_deleted = 1 ORDER BY timestamp DESC";
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ENVOYER DANS LA CORBEILLE (Mettre is_deleted = 1)
router.post('/delete', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Aucun ID fourni" });
    }
    const sql = "UPDATE logs SET is_deleted = 1 WHERE id IN (?)";
    req.db.query(sql, [ids], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: result.affectedRows });
    });
});

// RESTAURER DEPUIS LA CORBEILLE (Mettre is_deleted = 0)
router.post('/restore', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Aucun ID fourni" });
    }
    const sql = "UPDATE logs SET is_deleted = 0 WHERE id IN (?)";
    req.db.query(sql, [ids], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, restored: result.affectedRows });
    });
});

// PURGER DÉFINITIVEMENT (Supprimer définitivement de la base)
router.post('/purge', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Aucun ID fourni" });
    }
    const sql = "DELETE FROM logs WHERE id IN (?)";
    req.db.query(sql, [ids], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, purged: result.affectedRows });
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();

/**
 * RÔLE DU COMPOSANT (logs.js) :
 * Expose des statistiques agrégées à partir de la table "logs" (journal d'audit),
 * sans jamais renvoyer le détail brut des lignes — seulement des compteurs,
 * utilisés sur la page Statistiques du front-end.
 */

/**
 * @brief GET /api/logs/stats — compte les tâches supprimées et les membres retirés de l'équipe.
 */
router.get('/stats', (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM logs WHERE action = 'Suppression') AS tasksDeleted,
            (SELECT COUNT(*) FROM logs WHERE action = 'Suppression membre') AS membersRemoved
    `;
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

module.exports = router;

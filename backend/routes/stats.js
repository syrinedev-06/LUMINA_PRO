const express = require('express');
const router = express.Router();

// RÉCUPÉRER LA RÉPARTITION DES TÂCHES PAR PRIORITÉ
router.get('/tasks-priority', (req, res) => {
    const sql = `
        SELECT priority, COUNT(*) as count 
        FROM tasks 
        GROUP BY priority
    `;
    
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Si aucune tâche n'existe, on renvoie des données à zéro pour le graphique
        if (results.length === 0) {
            return res.json([
                { priority: 'low', count: 0 },
                { priority: 'medium', count: 0 },
                { priority: 'high', count: 0 }
            ]);
        }
        
        res.json(results);
    });
});

module.exports = router;

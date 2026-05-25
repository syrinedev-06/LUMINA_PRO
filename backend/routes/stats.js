const express = require('express');
const router = express.Router();

/**
 * RÔLE DU COMPOSANT (stats.js) :
 * Fournit les points de données analytiques pour générer des tableaux de bord statistiques (ex: graphiques Chart.js).
 */

/**
 * @brief Route GET pour récupérer la répartition des tâches par niveau de priorité (/api/stats/tasks-priority).
 * 
 * CONCEPT EXAMEN (GROUP BY & COUNT) :
 * - **GROUP BY priority** : Regroupe les lignes de la table `tasks` ayant la même valeur pour l'attribut `priority` ('high', 'medium', 'low').
 * - **COUNT(*)** : Fonction d'agrégation qui compte le nombre d'enregistrements dans chaque groupe.
 * - **Gestion de cas limite (Empty state)** : Si aucune tâche n'est présente en BDD, la requête renvoie un tableau vide. 
 *   Pour éviter que le frontend ne plante ou n'affiche un graphique vide d'informations de structure, 
 *   le contrôleur intercepte ce cas et renvoie une structure par défaut avec des compteurs à `0`.
 * 
 * @param {Object} req - Requête Express.
 * @param {Object} res - Réponse Express avec la structure JSON des statistiques.
 * @returns {void}
 */
router.get('/tasks-priority', (req, res) => {
    const sql = `
        SELECT priority, COUNT(*) as count 
        FROM tasks 
        GROUP BY priority
    `;
    
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Si aucune tâche n'existe, renvoyer des données vides structurées pour le graphique du frontend
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


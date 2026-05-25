const express = require('express');
const router = express.Router();

/**
 * RÔLE DU COMPOSANT (columns.js) :
 * Gère les colonnes du tableau Kanban (CRUD).
 * Chaque colonne possède un titre et un ordre de tri (`position`) pour l'affichage de gauche à droite.
 */

/**
 * @brief Route GET pour récupérer toutes les colonnes (/api/columns/).
 * 
 * CONCEPT EXAMEN (Trier par position) :
 * - `ORDER BY position ASC` : Assure que les colonnes soient toujours envoyées au client 
 *   dans l'ordre d'affichage correct (ex: "À faire" avant "En cours" avant "Terminé").
 * 
 * @param {Object} req - Requête Express.
 * @param {Object} res - Réponse Express avec la liste JSON des colonnes.
 * @returns {void}
 */
router.get('/', (req, res) => {
    req.db.query("SELECT * FROM columns ORDER BY position ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

/**
 * @brief Route POST pour ajouter une nouvelle colonne (/api/columns/).
 * 
 * CONCEPT EXAMEN (Agrégation SQL MAX) :
 * - Pour placer la nouvelle colonne automatiquement tout à fait à droite (en dernière position),
 *   on utilise d'abord la fonction d'agrégation `MAX(position)` sur la table `columns`.
 * - On calcule ensuite `maxPos + 1` pour définir la position de la nouvelle colonne.
 * - Si la table est vide, `result[0].maxPos` renvoie `null`, donc on retombe sur `0 + 1 = 1`.
 * 
 * @param {Object} req - Contient req.body.title.
 * @param {Object} res - Réponse Express avec les données de la colonne créée.
 * @returns {void}
 */
router.post('/', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Le titre est requis" });

    // Récupération de la position maximale actuelle
    req.db.query("SELECT MAX(position) as maxPos FROM columns", (err, result) => {
        const nextPos = (result[0].maxPos || 0) + 1;
        const sql = "INSERT INTO columns (title, position) VALUES (?, ?)";
        req.db.query(sql, [title, nextPos], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log d'activité
            req.db.query("INSERT INTO logs (action, details) VALUES ('Création', ?)", [`Nouvelle colonne "${title}" créée`]);

            res.json({ id: result.insertId, title, position: nextPos });
        });
    });
});

/**
 * @brief Route PUT pour renommer une colonne existante (/api/columns/:id).
 * 
 * @param {Object} req - Contient req.params.id (ID colonne) et req.body.title (nouveau nom).
 * @param {Object} res - Réponse HTTP de validation.
 * @returns {void}
 */
router.put('/:id', (req, res) => {
    const { title } = req.body;
    const sql = "UPDATE columns SET title = ? WHERE id = ?";
    req.db.query(sql, [title, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Log d'activité
        req.db.query("INSERT INTO logs (action, details) VALUES ('Modification', ?)", [`Colonne renommée en "${title}"`]);

        res.json({ message: "Colonne renommée." });
    });
});

/**
 * @brief Route DELETE pour supprimer une colonne (/api/columns/:id).
 * 
 * CONCEPT EXAMEN (Effets de bord / CASCADE) :
 * - Grâce à la contrainte de clé étrangère définie en base (`ON DELETE CASCADE`),
 *   la suppression d'une colonne entraîne automatiquement la suppression de toutes
 *   les tâches associées en base de données.
 * - Cela évite d'avoir des tâches orphelines, mais c'est une opération destructive.
 * 
 * @param {Object} req - Contient req.params.id (ID colonne à supprimer).
 * @param {Object} res - Réponse HTTP de validation.
 * @returns {void}
 */
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM columns WHERE id = ?";
    req.db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Log d'activité
        req.db.query("INSERT INTO logs (action, details) VALUES ('Suppression', 'Une colonne a été supprimée')");

        res.json({ message: "Colonne supprimée." });
    });
});

module.exports = router;


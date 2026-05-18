const express = require('express');
const router = express.Router();

// 1. RÉCUPÉRER TOUTES LES TÂCHES (Avec le nom de l'assigné)
router.get('/', (req, res) => {
    const sql = `
        SELECT tasks.*, users.name as assigned_name 
        FROM tasks 
        LEFT JOIN users ON tasks.id_assigned = users.id 
        ORDER BY id_col ASC, created_at DESC`;
    
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. CRÉER UNE NOUVELLE TÂCHE
router.post('/', (req, res) => {
    const { title, description, priority, id_col, id_assigned } = req.body;
    if (!title) return res.status(400).json({ error: "Le titre est obligatoire." });

    // Si on n'a pas de colonne spécifiée, on cherche la toute première
    const findColSql = "SELECT id FROM columns ORDER BY position ASC LIMIT 1";
    req.db.query(findColSql, (err, cols) => {
        if (err || cols.length === 0) return res.status(400).json({ error: "Aucune colonne trouvée. Créez une colonne d'abord." });
        
        const targetCol = id_col || cols[0].id;
        const sql = "INSERT INTO tasks (title, description, priority, id_col, id_assigned) VALUES (?, ?, ?, ?, ?)";
        
        req.db.query(sql, [title, description, priority, targetCol, id_assigned || null], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const logSql = "INSERT INTO logs (action, details) VALUES ('Création', ?)";
            req.db.query(logSql, [`Tâche "${title}" créée`]);

            res.status(201).json({ message: "Tâche créée !" });
        });
    });
});

// 3. MODIFIER UNE TÂCHE (OU DÉPLACER)
router.put('/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, priority, id_col, id_assigned } = req.body;

    // On construit la requête dynamiquement selon ce qu'on reçoit
    let sql = "UPDATE tasks SET ";
    let params = [];
    
    if (title) { sql += "title = ?, "; params.push(title); }
    if (description !== undefined) { sql += "description = ?, "; params.push(description); }
    if (priority) { sql += "priority = ?, "; params.push(priority); }
    if (id_col) { sql += "id_col = ?, "; params.push(id_col); }
    if (id_assigned !== undefined) { sql += "id_assigned = ?, "; params.push(id_assigned); }

    sql = sql.slice(0, -2); // On enlève la dernière virgule
    sql += " WHERE id = ?";
    params.push(taskId);

    req.db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // On enregistre dans l'historique
        const logSql = "INSERT INTO logs (action, details) VALUES ('Modification', ?)";
        const logMsg = title ? `Tâche "${title}" modifiée` : "Une tâche a été mise à jour ou déplacée";
        req.db.query(logSql, [logMsg]);

        res.json({ message: "Tâche mise à jour !" });
    });
});

// 4. SUPPRIMER UNE TÂCHE
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM tasks WHERE id = ?";
    req.db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // On enregistre dans l'historique
        const logSql = "INSERT INTO logs (action, details) VALUES ('Suppression', 'Une tâche a été supprimée')";
        req.db.query(logSql);

        res.json({ message: "Tâche supprimée." });
    });
});

module.exports = router;

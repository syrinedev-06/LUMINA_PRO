const express = require('express');
const router = express.Router();

// GET toutes les tâches avec le nom de la personne assignée
router.get('/', (req, res) => {
    const sql = `
        SELECT tasks.*, users.name AS assigned_name
        FROM tasks
        LEFT JOIN users ON tasks.id_assigned = users.id
        ORDER BY id_col ASC, FIELD(tasks.priority, 'high', 'medium', 'low') ASC, created_at DESC
    `;
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST créer une nouvelle tâche
router.post('/', (req, res) => {
    const { title, description, priority, id_col, id_assigned } = req.body;
    if (!title) return res.status(400).json({ error: "Le titre est obligatoire." });

    // Si aucune colonne choisie, on prend la première
    req.db.query("SELECT id FROM columns ORDER BY position ASC LIMIT 1", (err, cols) => {
        if (err || cols.length === 0) {
            return res.status(400).json({ error: "Aucune colonne trouvée." });
        }
        const targetCol = id_col || cols[0].id;
        const sql = "INSERT INTO tasks (title, description, priority, id_col, id_assigned) VALUES (?, ?, ?, ?, ?)";
        req.db.query(sql, [title, description, priority, targetCol, id_assigned || null], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Tâche créée !" });
        });
    });
});

// PUT modifier ou déplacer une tâche
router.put('/:id', (req, res) => {
    const { title, description, priority, id_col, id_assigned } = req.body;

    let sql = "UPDATE tasks SET ";
    const params = [];

    if (title)                     { sql += "title = ?, ";       params.push(title); }
    if (description !== undefined) { sql += "description = ?, "; params.push(description); }
    if (priority)                  { sql += "priority = ?, ";    params.push(priority); }
    if (id_col)                    { sql += "id_col = ?, ";      params.push(id_col); }
    if (id_assigned !== undefined) { sql += "id_assigned = ?, "; params.push(id_assigned); }

    sql = sql.slice(0, -2) + " WHERE id = ?";
    params.push(req.params.id);

    req.db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Tâche mise à jour !" });
    });
});

// DELETE supprimer une tâche
// Règle métier : un utilisateur standard ne peut supprimer que ses propres tâches
// (celles qui lui sont assignées). Un admin peut supprimer n'importe quelle tâche.
router.delete('/:id', (req, res) => {
    req.db.query("SELECT id_assigned FROM tasks WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Tâche introuvable." });

        const isOwner = results[0].id_assigned === req.user.id;
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres tâches." });
        }

        req.db.query("DELETE FROM tasks WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Tâche supprimée." });
        });
    });
});

module.exports = router;

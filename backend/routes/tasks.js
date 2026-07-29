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
    const { title, description, priority, id_col, id_assigned, due_date } = req.body;
    if (!title) return res.status(400).json({ error: "Le titre est obligatoire." });

    const findColSql = "SELECT id FROM columns ORDER BY position ASC LIMIT 1";
    req.db.query(findColSql, (err, cols) => {
        if (err || cols.length === 0) {
            return res.status(400).json({ error: "Aucune colonne trouvée." });
        }

        const targetCol = id_col || cols[0].id;
        const sql = "INSERT INTO tasks (title, description, priority, id_col, id_assigned, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)";

        req.db.query(sql, [title, description, priority, targetCol, id_assigned || null, due_date || null, req.user.id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Tâche créée !" });
        });
    });
});

/**
 * @brief PUT modifier ou déplacer une tâche (/api/tasks/:id).
 *
 * CONCEPT EXAMEN (Protection IDOR sur la modification) :
 * - Déplacer une tâche d'une colonne à une autre (id_col seul) est une action collaborative :
 *   n'importe quel membre de l'équipe peut le faire, même sur la tâche de quelqu'un d'autre
 *   (ex : faire avancer le travail collectif sur le tableau).
 * - Modifier le CONTENU d'une tâche (titre, description, priorité, assignation, échéance)
 *   est réservé à l'admin, à la personne assignée, ou à la personne qui a créé la tâche —
 *   la même règle que pour la suppression. Un utilisateur standard ne peut donc pas changer
 *   le contenu d'une tâche qui ne lui appartient pas, seulement la déplacer.
 */
router.put('/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, priority, id_col, id_assigned, due_date } = req.body;

    const triesToEditContent = !!title || description !== undefined || !!priority || id_assigned !== undefined || due_date !== undefined;

    req.db.query("SELECT id_assigned, created_by FROM tasks WHERE id = ?", [taskId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Tâche introuvable." });

        const task = results[0];
        const isAdmin = req.user.role === 'admin';
        const isOwner = task.id_assigned === req.user.id || task.created_by === req.user.id;

        if (triesToEditContent && !isAdmin && !isOwner) {
            return res.status(403).json({ error: "Vous pouvez seulement déplacer cette tâche, pas modifier son contenu." });
        }

        let sql = "UPDATE tasks SET ";
        let params = [];

        if (title) { sql += "title = ?, "; params.push(title); }
        if (description !== undefined) { sql += "description = ?, "; params.push(description); }
        if (priority)                  { sql += "priority = ?, ";    params.push(priority); }
        if (id_col)                    { sql += "id_col = ?, ";      params.push(id_col); }
        if (id_assigned !== undefined) { sql += "id_assigned = ?, "; params.push(id_assigned); }
        if (due_date !== undefined) { sql += "due_date = ?, "; params.push(due_date || null); }

        if (params.length === 0) {
            return res.status(400).json({ error: "Aucune donnée à modifier." });
        }

        sql = sql.slice(0, -2) + " WHERE id = ?";
        params.push(taskId);

        req.db.query(sql, params, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Tâche mise à jour !" });
        });
    });
});

/**
 * @brief Route DELETE pour supprimer définitivement une tâche (/api/tasks/:id).
 *
 * CONCEPT EXAMEN (Suppression de ressource + Protection IDOR) :
 * - Supprime l'enregistrement physique correspondant à l'identifiant.
 * - Enregistre une entrée de log indiquant la suppression.
 * - Protection IDOR (Insecure Direct Object Reference) : seul un administrateur
 *   peut supprimer n'importe quelle tâche. Un utilisateur standard ne peut supprimer
 *   que les tâches qui lui sont assignées (id_assigned === son propre id) OU celles
 *   qu'il a lui-même créées (created_by === son propre id), même assignées à quelqu'un
 *   d'autre — utile si l'assignation a été faite par erreur.
 *   Sans cette vérification, n'importe quel compte connecté pourrait supprimer
 *   les tâches des autres en devinant l'ID — c'est la faille IDOR.
 *
 * @param {Object} req - Contient req.params.id (l'ID de la tâche) et req.user (décodé par verifyToken).
 * @param {Object} res - Réponse HTTP confirmant la suppression.
 * @returns {void}
 */
router.delete('/:id', (req, res) => {
    const taskId = req.params.id;

    // Protection IDOR : on vérifie d'abord qui est propriétaire ou créateur de la tâche
    req.db.query("SELECT id_assigned, created_by FROM tasks WHERE id = ?", [taskId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Tâche introuvable." });

        const task = results[0];
        const isAdmin = req.user.role === 'admin';
        const isAssignee = task.id_assigned === req.user.id;
        const isCreator = task.created_by === req.user.id;

        // Seul l'admin, la personne assignée, ou la personne qui a créé la tâche peut supprimer
        if (!isAdmin && !isAssignee && !isCreator) {
            return res.status(403).json({ error: "Action interdite. Vous n'êtes pas autorisé à supprimer cette tâche." });
        }

        req.db.query("DELETE FROM tasks WHERE id = ?", [taskId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const logSql = "INSERT INTO logs (action, details) VALUES ('Suppression', 'Une tâche a été supprimée')";
            req.db.query(logSql);

            res.json({ message: "Tâche supprimée." });
        });
    });
});

module.exports = router;

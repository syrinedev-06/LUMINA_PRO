const express = require('express');
const router = express.Router();

/**
 * RÔLE DU COMPOSANT (tasks.js) :
 * Gère le cycle de vie complet des tâches du tableau Kanban (CRUD).
 * Intègre un système d'audit trail (historique) : chaque action (création, modification, suppression)
 * engendre automatiquement l'écriture d'une ligne de log dans la table `logs`.
 */

/**
 * @brief Route GET pour récupérer toutes les tâches (/api/tasks/).
 * 
 * CONCEPT EXAMEN (LEFT JOIN & Tri) :
 * - **LEFT JOIN** : Joint la table `tasks` à la table `users`. Si une tâche n'a pas d'utilisateur assigné 
 *   (id_assigned est NULL), la tâche est quand même renvoyée avec la colonne `assigned_name` à NULL.
 *   Un `INNER JOIN` masquerait les tâches non assignées !
 * - **ORDER BY** : Les tâches sont triées par colonne (`id_col`) puis par date de création décroissante 
 *   pour afficher les plus récentes en haut.
 * 
 * @param {Object} req - Requête Express.
 * @param {Object} res - Réponse Express contenant le tableau JSON de toutes les tâches.
 * @returns {void}
 */
router.get('/', (req, res) => {
    const sql = `
        SELECT tasks.*, users.name as assigned_name
        FROM tasks
        LEFT JOIN users ON tasks.id_assigned = users.id
        ORDER BY id_col ASC, FIELD(tasks.priority, 'high', 'medium', 'low') ASC, created_at DESC`;
    // FIELD() ordonne : high=1, medium=2, low=3 → URGENT en haut, NORMAL en bas dans chaque colonne
    
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

/**
 * @brief Route POST pour ajouter une nouvelle tâche (/api/tasks/).
 * 
 * CONCEPT EXAMEN (Sous-requête / Logique métier par défaut) :
 * - Si le client ne fournit pas d'ID de colonne (`id_col`), la tâche doit être placée 
 *   dans la toute première colonne du Kanban (ex: "À faire").
 * - On exécute donc d'abord une requête pour trouver la colonne ayant la position la plus basse (`LIMIT 1`).
 * - Une fois l'ID de colonne cible résolu, on effectue l'INSERT.
 * - **Audit Trail (Traçabilité)** : Après insertion, une ligne de log est insérée pour conserver trace de la création.
 * 
 * @param {Object} req - Requête contenant req.body (title, description, priority, id_col, id_assigned).
 * @param {Object} res - Réponse HTTP (201 Created).
 * @returns {void}
 */
router.post('/', (req, res) => {
    const { title, description, priority, id_col, id_assigned, due_date } = req.body;
    if (!title) return res.status(400).json({ error: "Le titre est obligatoire." });

    const findColSql = "SELECT id FROM columns ORDER BY position ASC LIMIT 1";
    req.db.query(findColSql, (err, cols) => {
        if (err || cols.length === 0) {
            return res.status(400).json({ error: "Aucune colonne trouvée. Créez une colonne d'abord." });
        }

        const targetCol = id_col || cols[0].id;
        const sql = "INSERT INTO tasks (title, description, priority, id_col, id_assigned, due_date) VALUES (?, ?, ?, ?, ?, ?)";

        req.db.query(sql, [title, description, priority, targetCol, id_assigned || null, due_date || null], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Écriture du log d'activité
            const logSql = "INSERT INTO logs (action, details) VALUES ('Création', ?)";
            req.db.query(logSql, [`Tâche "${title}" créée`]);

            res.status(201).json({ message: "Tâche créée !" });
        });
    });
});

/**
 * @brief Route PUT pour modifier ou déplacer une tâche (/api/tasks/:id).
 * 
 * CONCEPT EXAMEN (Construction SQL dynamique) :
 * - Le client peut modifier un seul attribut (ex: juste glisser-déposer pour changer `id_col`) 
 *   ou plusieurs (titre, description dans la modale).
 * - Pour éviter de devoir écrire 15 requêtes différentes, on assemble la requête `UPDATE`
 *   dynamiquement en fonction des clés fournies dans `req.body`.
 * - **Sécurité** : Les valeurs sont poussées dans un tableau `params` associé aux `?` pour éviter l'injection SQL.
 * 
 * @param {Object} req - Contient req.params.id et les attributs modifiés dans req.body.
 * @param {Object} res - Réponse HTTP (200 OK).
 * @returns {void}
 */
router.put('/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, priority, id_col, id_assigned, due_date } = req.body;

    // Construction dynamique du corps du SET SQL
    let sql = "UPDATE tasks SET ";
    let params = [];

    if (title) { sql += "title = ?, "; params.push(title); }
    if (description !== undefined) { sql += "description = ?, "; params.push(description); }
    if (priority) { sql += "priority = ?, "; params.push(priority); }
    if (id_col) { sql += "id_col = ?, "; params.push(id_col); }
    if (id_assigned !== undefined) { sql += "id_assigned = ?, "; params.push(id_assigned); }
    if (due_date !== undefined) { sql += "due_date = ?, "; params.push(due_date || null); }

    sql = sql.slice(0, -2); // Nettoyage de la virgule et de l'espace finaux
    sql += " WHERE id = ?";
    params.push(taskId);

    req.db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Log de la modification
        const logSql = "INSERT INTO logs (action, details) VALUES ('Modification', ?)";
        const logMsg = title ? `Tâche "${title}" modifiée` : "Une tâche a été mise à jour ou déplacée";
        req.db.query(logSql, [logMsg]);

        res.json({ message: "Tâche mise à jour !" });
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
 *   que les tâches qui lui sont assignées (id_assigned === son propre id).
 *   Sans cette vérification, n'importe quel compte connecté pourrait supprimer
 *   les tâches des autres en devinant l'ID — c'est la faille IDOR.
 *
 * @param {Object} req - Contient req.params.id (l'ID de la tâche) et req.user (décodé par verifyToken).
 * @param {Object} res - Réponse HTTP confirmant la suppression.
 * @returns {void}
 */
router.delete('/:id', (req, res) => {
    const taskId = req.params.id;

    // Protection IDOR : on vérifie d'abord qui est propriétaire de la tâche
    req.db.query("SELECT id_assigned FROM tasks WHERE id = ?", [taskId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Tâche introuvable." });

        const task = results[0];
        const isAdmin = req.user.role === 'admin';
        const isAssignee = task.id_assigned === req.user.id;

        // Seul l'admin ou la personne assignée peut supprimer
        if (!isAdmin && !isAssignee) {
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


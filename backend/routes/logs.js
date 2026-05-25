const express = require('express');
const router = express.Router();

/**
 * RÔLE DU COMPOSANT (logs.js) :
 * Gère l'historique d'activité (logs) et le système de Corbeille.
 * Intègre un concept de suppression logique (soft delete) et physique (hard delete).
 */

/**
 * @brief Route GET pour récupérer tous les logs actifs non supprimés (/api/logs/).
 * 
 * CONCEPT EXAMEN (Soft Delete - Logs actifs) :
 * - `WHERE is_deleted = 0` : Filtre pour récupérer uniquement les événements qui ne sont pas dans la Corbeille.
 * - Tri par `timestamp DESC` : Les logs les plus récents s'affichent en premier.
 * 
 * @param {Object} req - Requête Express.
 * @param {Object} res - Réponse Express retournant la liste JSON des logs actifs.
 * @returns {void}
 */
router.get('/', (req, res) => {
    const sql = "SELECT * FROM logs WHERE is_deleted = 0 ORDER BY timestamp DESC";
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

/**
 * @brief Route GET pour récupérer tous les logs mis à la Corbeille (/api/logs/trash).
 * 
 * CONCEPT EXAMEN (Soft Delete - Corbeille) :
 * - `WHERE is_deleted = 1` : Isole les logs qui ont été envoyés à la Corbeille.
 * 
 * @param {Object} req - Requête Express.
 * @param {Object} res - Réponse Express avec la liste JSON des logs supprimés logiquement.
 * @returns {void}
 */
router.get('/trash', (req, res) => {
    const sql = "SELECT * FROM logs WHERE is_deleted = 1 ORDER BY timestamp DESC";
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

/**
 * @brief Route POST pour envoyer des logs à la Corbeille (/api/logs/delete).
 * 
 * CONCEPT EXAMEN (Opérateur SQL IN & Traitement par lot) :
 * - `ids` est un tableau d'identifiants (ex: `[4, 8, 15]`).
 * - `id IN (?)` permet à MySQL de mettre à jour plusieurs lignes en une seule opération.
 * - Le champ `is_deleted` passe à `1` : c'est un **Soft Delete** (Suppression logique). 
 *   La donnée est toujours présente en base mais masquée des vues normales.
 * 
 * @param {Object} req - Requête contenant req.body.ids (tableau d'identifiants).
 * @param {Object} res - Réponse confirmant le nombre de lignes modifiées.
 * @returns {void}
 */
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

/**
 * @brief Route POST pour restaurer des logs depuis la Corbeille (/api/logs/restore).
 * 
 * CONCEPT EXAMEN (Restauration logique) :
 * - Repasse `is_deleted` à `0`, ce qui réintègre instantanément les lignes dans l'historique actif.
 * 
 * @param {Object} req - Requête contenant le tableau req.body.ids.
 * @param {Object} res - Réponse confirmant la restauration.
 * @returns {void}
 */
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

/**
 * @brief Route POST pour purger définitivement des logs (/api/logs/purge).
 * 
 * CONCEPT EXAMEN (Hard Delete - Suppression physique) :
 * - `DELETE FROM` supprime physiquement les enregistrements de l'espace de stockage de la base.
 * - Cette action est **irréversible** (pas de retour possible sans sauvegarde externe).
 * 
 * @param {Object} req - Requête contenant le tableau req.body.ids.
 * @param {Object} res - Réponse de succès de la purge.
 * @returns {void}
 */
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


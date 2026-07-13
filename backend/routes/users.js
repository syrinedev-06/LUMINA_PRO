const express = require('express');
const router = express.Router();

/**
 * RÔLE DU COMPOSANT (users.js) :
 * Ce fichier gère les opérations CRUD (Create, Read, Update, Delete) sur la ressource "users".
 * C'est une API RESTful où chaque méthode HTTP correspond à une action précise sur la ressource.
 * Toutes les routes ici sont protégées par le middleware de vérification JWT configuré dans server.js.
 */

/**
 * @brief Route GET pour récupérer tous les membres de l'équipe (/api/users/).
 * 
 * CONCEPT EXAMEN :
 * - **Sélection de champs (Projection SQL)** : Nous sélectionnons explicitement `id, name, email, role`.
 *   Il ne faut **jamais** renvoyer le champ `password` (même s'il est haché) pour des raisons de sécurité évidentes.
 * - **Statut HTTP 200 (OK)** : Renvoyé par défaut par Express lors d'un `res.json()`.
 * 
 * @param {Object} req - Requête Express.
 * @param {Object} res - Réponse Express retournant la liste JSON des utilisateurs.
 * @returns {void}
 */
router.get('/', (req, res) => {
    const sql = "SELECT id, name, email, role FROM users";
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});



/**
 * @brief Route DELETE pour supprimer un utilisateur (/api/users/:id).
 *
 * CONCEPT EXAMEN :
 * - **Suppression physique** : Supprime définitivement la ligne de l'utilisateur en base de données.
 * - **Protection IDOR + autorisation rôle** : Seul un administrateur peut supprimer un compte.
 *   Un utilisateur standard qui enverrait DELETE /api/users/2 recevrait un 403 Forbidden.
 *   Sans cette vérification, n'importe quel compte connecté pourrait supprimer n'importe quel
 *   autre compte en connaissant l'ID — c'est la faille IDOR.
 * - **Contrainte de clé étrangère** : id_assigned dans tasks est défini ON DELETE SET NULL :
 *   la suppression de l'utilisateur désassigne automatiquement ses tâches sans les supprimer.
 *
 * @param {Object} req - Contient req.params.id et req.user.role (décodé par verifyToken).
 * @param {Object} res - Réponse HTTP de validation.
 * @returns {void}
 */
router.delete('/:id', (req, res) => {
    // Protection : réservé aux administrateurs uniquement
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Action réservée aux administrateurs." });
    }

    const sql = "DELETE FROM users WHERE id = ?";
    req.db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Utilisateur introuvable." });
        res.json({ message: "Utilisateur supprimé." });
    });
});

module.exports = router;


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

        // Journalisation pour les statistiques (compteur "membres retirés" sur la page Statistiques)
        req.db.query("INSERT INTO logs (action, details) VALUES (?, ?)", ['Suppression membre', 'Un membre de l\'équipe a été retiré']);

        res.json({ message: "Utilisateur supprimé." });
    });
});

/**
 * @brief Route PUT pour changer le rôle d'un membre (/api/users/:id/role).
 *
 * CONCEPT EXAMEN :
 * - Permet à un admin de promouvoir un membre standard en administrateur (ou de le rétrograder).
 *   Utile en entreprise : le premier compte créé n'est pas forcément la seule personne
 *   qui doit avoir des droits d'administration au fil du temps (ex : un associé, un remplaçant).
 * - **Protection** : réservé aux administrateurs, comme la suppression d'un membre.
 * - **Garde-fou** : un admin ne peut pas se rétrograder lui-même s'il est le seul admin restant,
 *   pour éviter de se retrouver sans aucun administrateur dans l'équipe.
 *
 * @param {Object} req - Contient req.params.id, req.body.role ('admin' | 'user') et req.user.
 * @param {Object} res - Réponse HTTP de validation.
 * @returns {void}
 */
router.put('/:id/role', (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Action réservée aux administrateurs." });
    }
    const { role } = req.body;
    if (role !== 'admin' && role !== 'user') {
        return res.status(400).json({ error: "role doit être 'admin' ou 'user'." });
    }

    const applyChange = () => {
        req.db.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Utilisateur introuvable." });
            res.json({ message: role === 'admin' ? "Membre promu administrateur." : "Membre repassé en utilisateur standard." });
        });
    };

    if (role === 'user') {
        // Empêche de rétrograder le dernier admin restant (l'équipe ne doit jamais se retrouver sans admin)
        req.db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'", (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results[0].total <= 1) {
                return res.status(400).json({ error: "Impossible : il doit toujours rester au moins un administrateur." });
            }
            applyChange();
        });
    } else {
        applyChange();
    }
});

module.exports = router;


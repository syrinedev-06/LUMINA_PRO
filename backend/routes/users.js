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
 * @brief Route PUT pour mettre à jour les informations du profil d'un utilisateur (/api/users/:id).
 * 
 * CONCEPT EXAMEN :
 * - **Paramètre d'URL (req.params)** : L'identifiant de l'utilisateur à modifier est passé dans le chemin (`:id`).
 * - **Mise à jour partielle** : Permet à un utilisateur de modifier son nom et son email.
 * - **Requête SQL préparée** : Utilise des points d'interrogation pour insérer en toute sécurité les valeurs.
 * 
 * @param {Object} req - Requête contenant req.params.id, req.body.name, req.body.email.
 * @param {Object} res - Réponse confirmant le succès ou retournant une erreur 500.
 * @returns {void}
 */
router.put('/:id', (req, res) => {
    const { name, email } = req.body;
    const sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
    req.db.query(sql, [name, email, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Profil mis à jour !" });
    });
});

/**
 * @brief Route DELETE pour supprimer un utilisateur (/api/users/:id).
 * 
 * CONCEPT EXAMEN :
 * - **Suppression physique** : Supprime définitivement la ligne de l'utilisateur en base de données.
 * - **Contrainte de clé étrangère** : Si des tâches sont assignées à cet utilisateur,
 *   l'attribut `id_assigned` de la table tasks deviendra orphelin ou lèvera une contrainte.
 *   En production, on privilégie souvent une suppression logique (soft delete via un champ `is_deleted`) 
 *   ou on remplace la clé par NULL.
 * 
 * @param {Object} req - Contient req.params.id (l'identifiant utilisateur à détruire).
 * @param {Object} res - Réponse HTTP de validation.
 * @returns {void}
 */
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM users WHERE id = ?";
    req.db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Utilisateur supprimé." });
    });
});

module.exports = router;


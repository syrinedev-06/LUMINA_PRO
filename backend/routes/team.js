const express = require('express');
const router = express.Router();

/**
 * RÔLE DU COMPOSANT (team.js) :
 * Gère l'intégration d'un nouvel utilisateur dans l'équipe.
 * Un compte fraîchement créé démarre avec team_status = 'pending' (dashboard vide).
 * Il doit explicitement demander à rejoindre l'équipe (team_status = 'requested'),
 * puis N'IMPORTE QUEL MEMBRE DÉJÀ DANS L'ÉQUIPE (pas seulement l'admin) peut accepter
 * ou refuser la demande — choix réaliste pour une entreprise où un seul admin ne serait
 * pas toujours disponible pour valider les nouveaux arrivants.
 */

/**
 * @brief Vérifie que l'utilisateur connecté est bien 'member' avant de le laisser
 * voir ou traiter les demandes d'adhésion (peu importe son rôle admin/user).
 */
function requireMember(req, res, next) {
    req.db.query("SELECT team_status FROM users WHERE id = ?", [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0 || results[0].team_status !== 'member') {
            return res.status(403).json({ error: "Réservé aux membres de l'équipe." });
        }
        next();
    });
}

/**
 * @brief GET /api/team/status — statut d'équipe de l'utilisateur connecté.
 * Toujours lu en direct depuis la base (pas depuis le token JWT), pour refléter
 * immédiatement une décision de l'admin sans attendre une reconnexion.
 */
router.get('/status', (req, res) => {
    const sql = "SELECT team_status FROM users WHERE id = ?";
    req.db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });
        res.json({ team_status: results[0].team_status });
    });
});

/**
 * @brief POST /api/team/join — demande à rejoindre l'équipe.
 * Ne fait rien si l'utilisateur est déjà membre ou a déjà une demande en attente
 * (idempotent : rejouer l'action plusieurs fois ne casse rien).
 */
router.post('/join', (req, res) => {
    const sql = "UPDATE users SET team_status = 'requested' WHERE id = ? AND team_status = 'pending'";
    req.db.query(sql, [req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Demande envoyée, en attente de validation par un administrateur." });
    });
});

/**
 * @brief GET /api/team/requests — liste des demandes en attente.
 * Ouvert à tout membre de l'équipe (pas seulement l'admin) : dans une entreprise,
 * n'importe quel collègue déjà dans l'équipe peut valider l'arrivée d'un nouveau membre.
 */
router.get('/requests', requireMember, (req, res) => {
    const sql = "SELECT id, name, email FROM users WHERE team_status = 'requested'";
    req.db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

/**
 * @brief PUT /api/team/requests/:id — accepte ou refuse une demande.
 * Ouvert à tout membre de l'équipe (pas seulement l'admin) — voir GET /requests ci-dessus.
 * body: { action: 'accept' | 'reject' }
 * accept → team_status = 'member' (accès complet au tableau)
 * reject → team_status = 'pending' (peut redemander plus tard)
 */
router.put('/requests/:id', requireMember, (req, res) => {
    const { action } = req.body;
    if (action !== 'accept' && action !== 'reject') {
        return res.status(400).json({ error: "action doit être 'accept' ou 'reject'." });
    }
    const newStatus = action === 'accept' ? 'member' : 'pending';
    const sql = "UPDATE users SET team_status = ? WHERE id = ? AND team_status = 'requested'";
    req.db.query(sql, [newStatus, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Demande introuvable." });
        res.json({ message: action === 'accept' ? "Demande acceptée, l'utilisateur a rejoint l'équipe." : "Demande refusée." });
    });
});

module.exports = router;

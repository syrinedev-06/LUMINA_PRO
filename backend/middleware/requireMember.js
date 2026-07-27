/**
 * @brief Middleware qui bloque l'accès aux tâches/colonnes tant que l'utilisateur
 * n'a pas rejoint l'équipe (team_status = 'member').
 *
 * CONCEPT EXAMEN :
 * Sans ce middleware, un utilisateur en attente ('pending' ou 'requested') pourrait
 * quand même appeler directement /api/tasks ou /api/columns et voir toutes les données,
 * même si le front-end lui affiche un dashboard vide — la vraie sécurité doit toujours
 * être vérifiée côté serveur, jamais seulement côté navigateur.
 */
function requireMember(req, res, next) {
    req.db.query("SELECT team_status FROM users WHERE id = ?", [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0 || results[0].team_status !== 'member') {
            return res.status(403).json({ error: "Vous devez d'abord rejoindre l'équipe pour accéder à cette ressource." });
        }
        next();
    });
}

module.exports = requireMember;

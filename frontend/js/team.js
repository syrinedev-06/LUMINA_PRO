// 4. L'ÉQUIPE (visible par tous, suppression réservée à l'admin)
// =========================================================================

/**
 * @brief Affiche la liste des membres.
 *
 * Explication simple pour l'examen :
 * - Visible par tout le monde en lecture seule ; seul un admin voit le bouton supprimer.
 * - Sécurité client vs serveur : cacher le bouton sur le navigateur est pratique pour l'utilisateur normal,
 *   mais ce n'est pas une vraie sécurité. C'est le serveur (le backend) qui fait la vraie sécurité.
 *   Si un utilisateur normal tente de forcer l'appel DELETE malgré tout, le serveur bloque et renvoie
 *   un message d'interdiction (Erreur 403) car il vérifie le rôle lié au ticket JWT.
 */
async function showTeam() {
    document.getElementById('open-modal-btn').style.display = 'none';

    setActiveLink('nav-team');
    document.getElementById('page-title').innerText = "Membres de l'équipe";
    const area = document.getElementById('content-area');

    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const isAdmin = currentUser.role === 'admin';

    try {
        const response = await authFetch('http://localhost:3000/api/users');
        const users = await response.json();

        // Tout membre de l'équipe (admin ou non) peut voir et traiter les demandes d'adhésion —
        // dans une entreprise, un seul admin ne serait pas toujours disponible pour valider les nouveaux arrivants.
        let requestsHTML = '';
        {
            const reqRes = await authFetch('http://localhost:3000/api/team/requests');
            const requests = await reqRes.json();
            if (requests.length > 0) {
                requestsHTML = `
                <div class="data-card" style="margin-bottom:16px; border-left:4px solid #B8195E;">
                    <h3 style="padding:16px 16px 0; font-size:15px;">🔔 Demandes en attente (${requests.length})</h3>
                    <div class="table-scroll-wrapper">
                        <table class="data-table">
                            <thead><tr><th>Nom</th><th>Email</th><th>Actions</th></tr></thead>
                            <tbody>
                                ${requests.map(r => `
                                <tr>
                                    <td>${escapeHTML(r.name)}</td>
                                    <td>${escapeHTML(r.email)}</td>
                                    <td style="display:flex; gap:6px;">
                                        <button type="button" class="btn-primary-modal" style="padding:4px 12px; font-size:12px;" onclick="respondTeamRequest(${r.id}, 'accept')">Accepter</button>
                                        <button type="button" class="btn-delete" style="padding:4px 12px; font-size:12px;" onclick="respondTeamRequest(${r.id}, 'reject')">Refuser</button>
                                    </td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
            }
        }

        area.innerHTML = `
            ${requestsHTML}
            <div class="data-card">
                <div class="table-scroll-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Membre</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                ${isAdmin ? '<th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:10px; font-weight:600;">
                                            <div class="avatar" style="width:30px; height:30px; font-size:12px;">
                                                ${u.name ? escapeHTML(u.name).charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            ${escapeHTML(u.name)}
                                        </div>
                                    </td>
                                    <td>${escapeHTML(u.email)}</td>
                                    <td>
                                        ${u.role === 'admin'
                                            ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#fef3c7;color:#92400e;font-weight:700;font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid #fcd34d;">👑 Administrateur</span>`
                                            : `<span style="display:inline-flex;align-items:center;gap:4px;background:#eff6ff;color:#1d4ed8;font-weight:600;font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid #bfdbfe;">👤 Utilisateur</span>`
                                        }
                                    </td>
                                    <td><span style="color:#10b981;">●</span> Actif</td>
                                    ${isAdmin ? `
                                    <td style="display:flex; gap:6px;">
                                        <button type="button" class="icon-btn" aria-label="${u.role === 'admin' ? 'Rétrograder' : 'Promouvoir administrateur'} ${escapeHTML(u.name)}" title="${u.role === 'admin' ? 'Rétrograder en utilisateur' : 'Promouvoir administrateur'}" onclick="changeUserRole(${u.id}, '${u.role === 'admin' ? 'user' : 'admin'}')">${u.role === 'admin' ? '⬇️' : '👑'}</button>
                                        <button type="button" class="icon-btn" style="color:var(--danger); opacity:1;" aria-label="Retirer ${escapeHTML(u.name)}" onclick="deleteUser(${u.id})">🗑️</button>
                                    </td>` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    } catch (e) {
        area.innerHTML = "<p style='padding:20px; color:red;'>Erreur lors du chargement des membres.</p>";
    }
}

/**
 * @brief Supprime un utilisateur.
 */
async function deleteUser(id) {
    if (confirm("Voulez-vous vraiment retirer ce membre ?")) {
        await authFetch(`http://localhost:3000/api/users/${id}`, {
            method: "DELETE"
        });
        showTeam();
    }
}

/**
 * @brief Promeut un membre administrateur, ou le rétrograde en utilisateur standard.
 * @param {number} id - id du membre concerné.
 * @param {string} newRole - 'admin' ou 'user'.
 */
async function changeUserRole(id, newRole) {
    const question = newRole === 'admin'
        ? "Promouvoir ce membre administrateur ?"
        : "Retirer les droits administrateur de ce membre ?";
    if (!confirm(question)) return;

    const res = await authFetch(`http://localhost:3000/api/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole })
    });
    const data = await res.json();
    if (!res.ok) {
        alert(data.error || "Une erreur est survenue.");
        return;
    }
    showTeam();
}

// =========================================================================
// 5. REJOINDRE UNE ÉQUIPE (nouveau compte, dashboard vide)
// =========================================================================

/**
 * @brief Affiche l'écran "Rejoindre l'équipe" à la place du tableau Kanban,
 * pour un utilisateur dont team_status n'est pas encore 'member'.
 * @param {string} status - 'pending' (n'a encore rien demandé) ou 'requested' (en attente de validation admin).
 */
function showJoinTeam(status) {
    document.getElementById('page-title').innerText = "Rejoindre l'équipe";
    const area = document.getElementById('content-area');

    if (status === 'requested') {
        area.innerHTML = `
            <div class="data-card" style="max-width:480px; margin:60px auto; text-align:center; padding:32px 24px;">
                <div style="font-size:40px; margin-bottom:12px;" aria-hidden="true">⏳</div>
                <h3 style="margin-bottom:8px;">Demande envoyée</h3>
                <p style="color:var(--text-muted);">Votre demande pour rejoindre l'équipe est en attente de validation par un administrateur. Revenez un peu plus tard.</p>
            </div>`;
    } else {
        area.innerHTML = `
            <div class="data-card" style="max-width:480px; margin:60px auto; text-align:center; padding:32px 24px;">
                <div style="font-size:40px; margin-bottom:12px;" aria-hidden="true">👋</div>
                <h3 style="margin-bottom:8px;">Bienvenue sur Lumina Pro</h3>
                <p style="color:var(--text-muted); margin-bottom:20px;">Vous n'appartenez pas encore à une équipe. Demandez à la rejoindre pour accéder au tableau Kanban.</p>
                <button type="button" class="btn-primary-modal" onclick="requestJoinTeam()">Demander à rejoindre l'équipe</button>
            </div>`;
    }
}

/**
 * @brief Envoie la demande d'adhésion à l'équipe, puis rafraîchit l'écran.
 */
async function requestJoinTeam() {
    await authFetch('http://localhost:3000/api/team/join', { method: 'POST' });
    showJoinTeam('requested');
}

/**
 * @brief Accepte ou refuse une demande d'adhésion (admin uniquement).
 * @param {number} id - id de l'utilisateur demandeur.
 * @param {string} action - 'accept' ou 'reject'.
 */
async function respondTeamRequest(id, action) {
    await authFetch(`http://localhost:3000/api/team/requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action })
    });
    showTeam();
    checkPendingTeamRequests();
}

/**
 * @brief Vérifie s'il y a des demandes d'adhésion en attente et met à jour le badge
 * sur le lien de navigation "Équipe" (admin uniquement, appelé au chargement du dashboard).
 */
async function checkPendingTeamRequests() {
    try {
        const res = await authFetch('http://localhost:3000/api/team/requests');
        const requests = await res.json();
        const badge = document.getElementById('team-badge');
        if (badge) {
            if (requests.length > 0) {
                badge.textContent = requests.length;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) {
        // Le badge n'est qu'indicatif, une erreur ici ne doit pas bloquer le reste du dashboard
    }
}

// =========================================================================

// 4. L'ÉQUIPE (SEULEMENT POUR L'ADMIN)
// =========================================================================

/**
 * @brief Affiche la liste des membres.
 * 
 * Explication simple pour l'examen :
 * - Sécurité client vs serveur : Cacher l'onglet sur le navigateur est pratique pour l'utilisateur normal, 
 *   mais ce n'est pas une vraie sécurité. C'est le serveur (le backend) qui fait la vraie sécurité. 
 *   Si un utilisateur normal tente de forcer l'accès à cette adresse, le serveur bloque et renvoie 
 *   un message d'interdiction (Erreur 403) car il vérifie le rôle lié au ticket JWT.
 */
async function showTeam() {
    document.getElementById('open-modal-btn').style.display = 'none';

    setActiveLink('nav-team');
    document.getElementById('page-title').innerText = "Membres de l'équipe";
    const area = document.getElementById('content-area');

    try {
        const response = await authFetch('http://localhost:3000/api/users');
        const users = await response.json();

        area.innerHTML = `
            <div class="data-card">
                <div class="table-scroll-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Membre</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Actions</th>
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
                                        <span class="badge badge-role" style="margin:0;">${escapeHTML(u.role)}</span>
                                    </td>
                                    <td><span style="color:#10b981;">●</span> Actif</td>
                                    <td>
                                        <button type="button" class="icon-btn" style="color:var(--danger); opacity:1;" aria-label="Retirer ${escapeHTML(u.name)}" onclick="deleteUser(${u.id})">🗑️</button>
                                    </td>
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

// =========================================================================

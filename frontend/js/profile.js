// 5. LE PROFIL PERSONNEL
// =========================================================================

/**
 * @brief Affiche nos informations de profil.
 */
function showProfile() {
    // Fermeture automatique du menu sur mobile après un clic sur le profil
    if (window.innerWidth <= 900) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            toggleSidebar(); // referme le menu
        }
    }

    const user = JSON.parse(localStorage.getItem('user'));
    
    document.getElementById('profile-info-content').innerHTML = `
        <div class="avatar custom-avatar" style="width:60px; height:60px; margin:0 auto 10px auto; border-radius: 50%;">
            <svg viewBox="0 0 24 24" width="30" height="30" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="10" cy="8" r="5"></circle>
                <path d="M3 21v-2a7 7 0 0 1 10-6.5"></path>
                <path d="M15 19l6-6 2 2-6 6-3 1z"></path>
            </svg>
        </div>
        <h2 style="margin-bottom: 5px; font-size: 20px;">${escapeHTML(user.name)}</h2>
        <p style="color: var(--text-muted); font-size: 13px;">Membre de Lumina Workspace</p>

        <table class="profile-table" style="margin-top: 10px;">
            <tr><th>Nom</th><td>${escapeHTML(user.name)}</td></tr>
            <tr><th>Email</th><td>${escapeHTML(user.email)}</td></tr>
            <tr><th>Rôle</th><td><span class="badge badge-role" style="margin:0;">${escapeHTML(user.role)}</span></td></tr>
            <tr><th>ID Compte</th><td>#${user.id}</td></tr>
            <tr><th>Statut</th><td><span style="color:#10b981;">●</span> En ligne</td></tr>
        </table>

        <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center;">
            <button class="btn-primary-modal" style="width: auto; padding: 8px 20px;" onclick="document.getElementById('profile-info-modal').style.display='none'; openProfileModal();">
                Modifier
            </button>
            <button class="btn-secondary" style="width: auto; padding: 8px 20px;" onclick="document.getElementById('profile-info-modal').style.display='none'">
                Fermer
            </button>
        </div>`;
        
    document.getElementById('profile-info-modal').style.display = 'flex';
}

/**
 * @brief Ouvre la fenêtre (modale) pour modifier le profil.
 */
function openProfileModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('edit-profile-name').value = user.name;
    document.getElementById('edit-profile-email').value = user.email;
    document.getElementById('profile-modal').style.display = 'flex';
}

/**
 * @brief Envoie les nouvelles infos du profil au serveur.
 * 
 * Explication simple pour l'examen :
 * - e.preventDefault() : Par défaut, quand on valide un formulaire, le navigateur recharge toute 
 *   la page. On utilise cette fonction pour lui dire "Attends, ne recharge pas ! Je vais envoyer 
 *   les informations en arrière-plan sans perturber l'utilisateur".
 */
async function handleProfileSubmit(e) {
    e.preventDefault(); 
    const user = JSON.parse(localStorage.getItem('user'));
    const name = document.getElementById('edit-profile-name').value;
    const email = document.getElementById('edit-profile-email').value;

    const response = await authFetch(`http://localhost:3000/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email })
    });

    if (response.ok) {
        // On met à jour nos infos stockées localement
        user.name = name;
        user.email = email;
        localStorage.setItem('user', JSON.stringify(user));
        
        document.getElementById('profile-modal').style.display = 'none';
        showProfile();
        document.getElementById('user-name').innerText = name; 
    } else {
        alert("Erreur lors de la mise à jour.");
    }
}

// =========================================================================

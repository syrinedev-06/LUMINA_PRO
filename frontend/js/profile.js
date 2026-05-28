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

            <button class="btn-secondary" style="width: auto; padding: 8px 20px;" onclick="document.getElementById('profile-info-modal').style.display='none'">
                Fermer
            </button>
        </div>`;
        
    document.getElementById('profile-info-modal').style.display = 'flex';
}



// =========================================================================

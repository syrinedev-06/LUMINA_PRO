/**
 * =========================================================================
 * MODULE : INTERFACE UTILISATEUR (UI)
 * =========================================================================
 * Gère les menus, la navigation, et l'affichage des fenêtres (modales).
 */

/**
 * @brief Prépare les actions des boutons (cliquer sur +, fermer la modale, se déconnecter).
 */
function setupEventListeners() {
    const modal = document.getElementById('task-modal');
    if (!modal) return;

    // Ouvrir la modale en cliquant sur le bouton "+"
    const openBtn = document.getElementById('open-modal-btn');
    if (openBtn) {
        openBtn.onclick = () => {
            resetTaskForm(); 
            modal.style.display = 'flex'; 
        };
    }

    // Fermer en cliquant sur "Annuler"
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Fermer TOUTES les modales si on clique dans le vide
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) {
                m.style.display = 'none';
            }
        });
    });

    const taskForm = document.getElementById('task-form');
    if (taskForm) taskForm.onsubmit = handleTaskSubmit;

    const profileForm = document.getElementById('profile-form');
    if (profileForm) profileForm.onsubmit = handleProfileSubmit;

    const deleteBtn = document.getElementById('delete-task-btn');
    if (deleteBtn) deleteBtn.onclick = deleteTask;

    // Déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear(); 
            window.location.href = 'login.html'; 
        };
    }
}

/**
 * @brief Revient à la vue Kanban principale.
 */
function showKanban() {
    document.getElementById('open-modal-btn').style.display = 'block';
    setActiveLink('nav-dashboard');
    document.getElementById('page-title').innerText = "Tableau de bord Kanban";

    document.getElementById('content-area').innerHTML = `
        <div class="kanban-container" id="kanban-view">
            <div id="kanban-board" class="kanban-board">
                <p style="padding:20px;">Chargement du tableau...</p>
            </div>
        </div>`;

    fetchTasks();
}

/**
 * @brief Remplit la liste des collaborateurs dans le sélecteur d'assignation.
 */
async function loadUsers() {
    try {
        const response = await authFetch('http://localhost:3000/api/users');
        const users = await response.json();
        const select = document.getElementById('task-assign');
        
        if (select) {
            select.innerHTML = '<option value="">Attribuer à...</option>' +
                users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
        }
    } catch (e) {
        console.warn("Erreur chargement utilisateurs");
    }
}

/** Active visuellement l'onglet sélectionné dans la barre latérale. */
function setActiveLink(id) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active'); 

    // Fermeture automatique du menu sur mobile après un clic sur un onglet
    if (window.innerWidth <= 900) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            toggleSidebar(); // referme le menu
        }
    }
}

/** Remet le formulaire à zéro. */
function resetTaskForm() {
    const form = document.getElementById('task-form');
    if (form) form.reset();
    
    document.getElementById('task-id').value = "";
    document.getElementById('delete-task-btn').style.display = "none"; 
}

/**
 * Affiche ou cache le menu latéral sur téléphone.
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const isOpen = sidebar.classList.toggle('open');
    let overlay = document.getElementById('sidebar-overlay');

    if (isOpen) {
        if (!overlay) {
            // On crée un fond sombre cliquable pour refermer le menu
            overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 999;
                background: rgba(15,23,42,0.4);
                backdrop-filter: blur(2px);
                cursor: pointer;
            `;
            overlay.onclick = toggleSidebar;
            document.body.appendChild(overlay);
        }
    } else {
        if (overlay) {
            overlay.remove();
        }
    }
}

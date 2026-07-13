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


    const taskForm = document.getElementById('task-form');
    if (taskForm) taskForm.onsubmit = handleTaskSubmit;

    const titleInput = document.getElementById('task-title');
    if (titleInput) {
        titleInput.addEventListener('input', () => {
            const err = document.getElementById('task-title-error');
            if (err) err.style.display = 'none';
            titleInput.removeAttribute('aria-invalid');
        });
    }

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
            <div style="display:flex; align-items:center; gap:16px; padding:16px 28px 0;">
                <div style="position:relative; flex:1; max-width:320px;">
                    <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none;">🔍</span>
                    <input type="search" id="search-input" placeholder="Rechercher une tâche..." oninput="filterTasks()"
                        style="width:100%; padding:8px 12px 8px 32px; border:1px solid var(--border); border-radius:10px; background:var(--card-bg); color:var(--text); font-size:14px; outline:none;"
                        aria-label="Rechercher une tâche">
                </div>
                <div id="kanban-stats" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;"></div>
            </div>
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

    // Refermer automatiquement le menu sur mobile après le clic
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

/** Remet le formulaire à zéro. */
function resetTaskForm() {
    const form = document.getElementById('task-form');
    if (form) form.reset();

    document.getElementById('task-id').value = "";
    document.getElementById('delete-task-btn').style.display = "none";

    const err = document.getElementById('task-title-error');
    if (err) err.style.display = 'none';
    const titleInput = document.getElementById('task-title');
    if (titleInput) titleInput.removeAttribute('aria-invalid');
}

/**
 * Affiche ou cache le menu latéral sur téléphone.
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.querySelector('.sidebar-toggle');
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active', isOpen);
    if (btn) btn.setAttribute('aria-expanded', isOpen);
}

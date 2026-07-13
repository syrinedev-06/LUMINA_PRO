// ==========================================================
// 1. INITIALISATION DU TABLEAU DE BORD
// Lancé au chargement de la page, vérifie l'authentification
// et configure l'interface selon le rôle de l'utilisateur.
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Si pas de token JWT en session → redirection vers la page de connexion
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    // Récupération des infos utilisateur stockées au login
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('user-name').innerText = user.name;

    // L'avatar est cliquable pour ouvrir la page de profil
    document.querySelector('.avatar').style.cursor = "pointer";
    document.querySelector('.avatar').onclick = showProfile;

    // --- RESTRICTION RÔLE : Seul l'admin voit l'onglet "Équipe" ---
    const teamNav = document.getElementById('nav-team');
    if (teamNav) {
        if (user.role === 'admin') {
            teamNav.style.display = 'block'; // Visible pour admin
        } else {
            teamNav.style.display = 'none';  // Caché pour les autres rôles
        }
    }

    // Chargement des données initiales
    fetchTasks();        // Colonnes + tâches du Kanban
    loadUsers();         // Liste des utilisateurs (pour assignation)
    setupEventListeners(); // Événements des boutons/formulaires
});

// ==========================================================
// 2. KANBAN DYNAMIQUE
// Gestion des colonnes et des cartes de tâches avec drag & drop
// ==========================================================

/**
 * Charge les colonnes et les tâches depuis l'API,
 * puis génère le tableau Kanban.
 */
async function fetchTasks() {
    try {
        // Récupération des colonnes du tableau
        const resCol = await fetch('http://localhost:3000/api/columns');
        const columns = await resCol.json();

        // Récupération des tâches (nécessite le token d'authentification)
        const resTasks = await fetch('http://localhost:3000/api/tasks', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const tasks = await resTasks.json();

        renderBoard(columns, tasks); // Génération du tableau
    } catch (e) {
        console.error("Erreur chargement Kanban :", e);
        const board = document.getElementById('kanban-board');
        if (board) board.innerHTML = "<p style='color:red; padding:20px;'>Erreur de connexion au serveur.</p>";
    }
}

/**
 * Génère et injecte l'HTML complet du tableau Kanban.
 * Chaque colonne est un groupe de tâches glissables.
 * Le Kanban est organisé en grandes catégories scrollables
 * (chaque colonne = une section indépendante).
 * @param {Array} columns - Liste des colonnes
 * @param {Array} tasks   - Liste de toutes les tâches
 */
function renderBoard(columns, tasks) {
    const board = document.getElementById('kanban-board');
    if (!board) return;
    board.innerHTML = "";

    // Message si aucune colonne n'existe encore
    if (columns.length === 0) {
        board.innerHTML = "<p style='padding:20px;'>Aucune colonne. Créez-en une avec le bouton ci-dessous !</p>";
    }

    // Chaque colonne = une grande catégorie de tâches (section scrollable verticalement)
    columns.forEach(col => {
        // Filtrer les tâches appartenant à cette colonne
        const colTasks = tasks.filter(t => t.id_col === col.id);

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column'; // Classe CSS qui définit la largeur et le scroll interne
        colEl.innerHTML = `
            <h4>
                ${col.title.toUpperCase()}
                <div style="display:flex; align-items:center; gap:8px;">
                    <!-- Compteur de tâches dans la colonne -->
                    <span class="notif-badge" style="position:static; padding:2px 8px;">${colTasks.length}</span>
                    <!-- Bouton renommer la colonne -->
                    <span class="icon-btn" title="Renommer" onclick="renameColumn(${col.id}, '${col.title.replace(/'/g, "\\'")}')">✏️</span>
                    <!-- Bouton supprimer la colonne -->
                    <span class="icon-btn" title="Supprimer" onclick="deleteColumn(${col.id})">×</span>
                </div>
            </h4>
            <!-- Zone de dépôt des tâches (drag & drop) - scrollable indépendamment -->
            <div class="task-list" ondragover="allowDrop(event)" ondrop="drop(event, ${col.id})">
                ${colTasks.map(task => `
                    <div class="task-card" draggable="true" ondragstart="drag(event, ${task.id})">
                        <!-- Badge de priorité coloré -->
                        <span class="badge bg-${task.priority}">${task.priority}</span>
                        <h5>${task.title}</h5>
                        <p>${task.description || ''}</p>
                        <div class="assigned-to">👤 ${task.assigned_name || 'Non assigné'}</div>
                        <div class="task-actions">
                            <span class="icon-btn" title="Modifier" onclick="editTask(${JSON.stringify(task).replace(/"/g, '&quot;')})">✏️</span>
                            <span class="icon-btn" title="Supprimer" onclick="directDeleteTask(${task.id})">🗑️</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        board.appendChild(colEl);
    });

    // Bouton d'ajout d'une nouvelle colonne (à la fin du board)
    const addBtn = document.createElement('div');
    addBtn.className = 'btn-add-column';
    addBtn.onclick = addNewColumn;
    addBtn.innerHTML = '+ Ajouter une colonne';
    board.appendChild(addBtn);
}

/**
 * Crée une nouvelle colonne via une invite utilisateur.
 */
async function addNewColumn() {
    const title = prompt("Nom de la nouvelle colonne :");
    if (title && title.trim()) {
        await fetch('http://localhost:3000/api/columns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title.trim() })
        });
        fetchTasks(); // Rafraîchir l'affichage
    }
}

/**
 * Supprime une colonne et toutes ses tâches après confirmation.
 */
async function deleteColumn(id) {
    if (confirm("Supprimer cette colonne et toutes ses tâches ?")) {
        await fetch(`http://localhost:3000/api/columns/${id}`, { method: 'DELETE' });
        fetchTasks();
    }
}

/**
 * Renomme une colonne existante.
 */
async function renameColumn(id, currentTitle) {
    const newTitle = prompt("Nouveau nom de la colonne :", currentTitle);
    if (newTitle && newTitle !== currentTitle) {
        await fetch(`http://localhost:3000/api/columns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });
        fetchTasks();
    }
}

// ==========================================================
// 3. STATISTIQUES
// Graphique en camembert de la répartition des tâches par priorité
// ==========================================================
async function showStats() {
    setActiveLink('nav-stats');
    document.getElementById('page-title').innerText = "Statistiques de Productivité";
    const area = document.getElementById('content-area');

    // Structure HTML de la page statistiques
    area.innerHTML = `
        <div style="max-width: 450px; margin: 60px auto; background: white; padding: 40px; border-radius: 30px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.05);">
            <h3 style="margin-bottom:25px; color:var(--dark);">Répartition des Missions</h3>
            <div style="position: relative; height:300px;">
                <canvas id="priorityChart"></canvas>
            </div>
            <p id="no-data-msg" style="display:none; margin-top:20px; color:var(--text-muted);">Aucune tâche à analyser pour le moment.</p>
        </div>`;

    try {
        const response = await fetch("http://localhost:3000/api/stats/tasks-priority");
        const data = await response.json();

        // Si aucune tâche, on affiche un message vide
        const total = data.reduce((acc, curr) => acc + curr.count, 0);
        if (total === 0) {
            document.getElementById('no-data-msg').style.display = 'block';
            return;
        }

        // Création du graphique Chart.js
        const ctx = document.getElementById("priorityChart").getContext("2d");
        new Chart(ctx, {
            type: "pie",
            data: {
                labels: data.map(d => d.priority === 'high' ? 'Haute' : d.priority === 'medium' ? 'Moyenne' : 'Basse'),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20, font: { family: 'Inter', size: 14 } } }
                }
            }
        });
    } catch (error) {
        console.error("Erreur Stats :", error);
        area.innerHTML = "<p style='text-align:center; padding:50px;'>Impossible de charger les statistiques.</p>";
    }
}

// ==========================================================
// 4. ÉQUIPE — Accessible uniquement aux admins
// Affiche la liste de tous les membres avec actions de gestion
// ==========================================================
async function showTeam() {
    // Vérification côté client que l'utilisateur est bien admin
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        document.getElementById('content-area').innerHTML =
            "<p style='text-align:center; padding:60px; color:var(--text-muted);'>⛔ Accès réservé à l'administrateur.</p>";
        return;
    }

    setActiveLink('nav-team');
    document.getElementById('page-title').innerText = "Membres de l'équipe";
    const area = document.getElementById('content-area');

    try {
        const response = await fetch('http://localhost:3000/api/users');
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
                                            <div class="avatar" style="width:30px; height:30px; font-size:12px;">${u.name ? u.name.charAt(0).toUpperCase() : 'U'}</div>
                                            ${u.name}
                                        </div>
                                    </td>
                                    <td>${u.email}</td>
                                    <td><span class="badge" style="background:#f1f5f9; color:var(--dark); margin:0;">${u.role}</span></td>
                                    <td><span style="color:#10b981;">●</span> Actif</td>
                                    <td>
                                        <span class="icon-btn" style="color:var(--danger); opacity:1;" title="Retirer" onclick="deleteUser(${u.id})">🗑️</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    } catch (e) {
        area.innerHTML = "<p style='padding:20px; color:red;'>Erreur lors du chargement de l'équipe.</p>";
    }
}

/**
 * Supprime un utilisateur après confirmation.
 */
async function deleteUser(id) {
    if (confirm("Retirer ce membre de l'équipe ?")) {
        await fetch(`http://localhost:3000/api/users/${id}`, { method: "DELETE" });
        showTeam();
    }
}

// ==========================================================
// 5. PROFIL UTILISATEUR
// Affiche les informations du compte connecté, avec possibilité de modification
// ==========================================================
function showProfile() {
    setActiveLink('nav-profile');
    document.getElementById('page-title').innerText = "Mon Profil Personnel";
    const user = JSON.parse(localStorage.getItem('user'));

    document.getElementById('content-area').innerHTML = `
        <div class="profile-container">
            <div class="profile-card">
                <!-- Avatar initiales de l'utilisateur -->
                <div class="avatar" style="width:90px; height:90px; font-size:40px; margin:0 auto 20px auto; border-radius: 20px;">👤</div>
                <h2 style="margin-bottom: 5px;">${user.name}</h2>
                <p style="color: var(--text-muted); font-size: 14px;">Membre de Lumina Workspace</p>

                <!-- Tableau d'informations du profil -->
                <table class="profile-table">
                    <tr><th>Nom Complet</th><td>${user.name}</td></tr>
                    <tr><th>Adresse Email</th><td>${user.email}</td></tr>
                    <tr><th>Rôle</th><td><span class="badge" style="background:#f1f5f9; color:var(--dark); margin:0;">${user.role}</span></td></tr>
                    <tr><th>ID Compte</th><td>#${user.id}</td></tr>
                    <tr><th>Statut</th><td><span style="color:#10b981;">●</span> En ligne</td></tr>
                </table>

                <button class="btn-primary-modal" style="margin-top:20px; width: auto; padding: 10px 25px;" onclick="openProfileModal()">
                    Modifier mes informations
                </button>
            </div>
        </div>`;
}

/**
 * Ouvre la modale d'édition du profil avec les données actuelles.
 */
function openProfileModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('edit-profile-name').value = user.name;
    document.getElementById('edit-profile-email').value = user.email;
    document.getElementById('profile-modal').style.display = 'flex';
}

/**
 * Envoie les modifications de profil au serveur et met à jour le localStorage.
 */
async function handleProfileSubmit(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const name = document.getElementById('edit-profile-name').value;
    const email = document.getElementById('edit-profile-email').value;

    const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
    });

    if (response.ok) {
        // Mise à jour locale des données utilisateur
        user.name = name;
        user.email = email;
        localStorage.setItem('user', JSON.stringify(user));
        document.getElementById('profile-modal').style.display = 'none';
        showProfile(); // Rafraîchir la page profil
        document.getElementById('user-name').innerText = name; // Mettre à jour la topbar
    } else {
        alert("Erreur lors de la mise à jour du profil.");
    }
}

// ==========================================================
// 6. HISTORIQUE D'ACTIVITÉ
// Affiche les logs d'actions avec correction du bug de chargement
// ==========================================================
let currentHistoryLogs = [];
let historyCurrentPage = 1;
const historyPerPage = 10;
let historyView = 'active'; // 'active' ou 'trash'

async function showHistory(page = 1, view = 'active') {
    setActiveLink('nav-history');
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = "Historique & Corbeille";

    historyView = view;
    historyCurrentPage = page;
    const area = document.getElementById('content-area');
    
    area.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted);">⏳ Chargement de l'historique...</div>`;
    
    try {
        const endpoint = historyView === 'trash' ? 'http://localhost:3000/api/logs/trash' : 'http://localhost:3000/api/logs';
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        currentHistoryLogs = await response.json();
        renderHistoryTable();
    } catch (e) {
        console.error("Erreur historique :", e);
        area.innerHTML = "<p style='text-align:center; padding:50px; color:red;'>Impossible de charger les données. Vérifiez que le serveur est actif.</p>";
    }
}

function renderHistoryTable() {
    const area = document.getElementById('content-area');
    const start = (historyCurrentPage - 1) * historyPerPage;
    const end = start + historyPerPage;
    const paginatedLogs = currentHistoryLogs.slice(start, end);
    const totalPages = Math.ceil(currentHistoryLogs.length / historyPerPage);

    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user && user.role === 'admin';

    let tableHTML = `
        <!-- Onglets Historique / Corbeille -->
        <div style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:10px; margin-left:30px; margin-right:30px; margin-top:20px;">
            <button onclick="showHistory(1, 'active')" style="background:none; border:none; padding:8px 16px; font-weight:600; font-size:14px; cursor:pointer; color: ${historyView === 'active' ? 'var(--primary)' : '#64748b'}; border-bottom: 2px solid ${historyView === 'active' ? 'var(--primary)' : 'transparent'};">📜 Historique actif</button>
            <button onclick="showHistory(1, 'trash')" style="background:none; border:none; padding:8px 16px; font-weight:600; font-size:14px; cursor:pointer; color: ${historyView === 'trash' ? 'var(--primary)' : '#64748b'}; border-bottom: 2px solid ${historyView === 'trash' ? 'var(--primary)' : 'transparent'};">🗑️ Corbeille</button>
        </div>

        <div class="data-card" style="margin-top:10px;">
            ${isAdmin ? `
            <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; gap:10px;">
                    ${historyView === 'active' ? `
                        <button onclick="deleteSelectedLogs()" class="btn-delete" style="width:auto; padding:8px 16px;">Mettre à la corbeille</button>
                    ` : `
                        <button onclick="restoreSelectedLogs()" class="btn-primary-modal" style="width:auto; padding:8px 16px; background-color:#10b981; color:white; border:none; border-radius:12px; font-weight:600; cursor:pointer; font-size:14px;">Restaurer la sélection</button>
                        <button onclick="purgeSelectedLogs()" class="btn-delete" style="width:auto; padding:8px 16px; background-color:#ef4444; color:white;">Supprimer définitivement</button>
                    `}
                </div>
                <label style="cursor:pointer; font-size:13px; font-weight:600;"><input type="checkbox" id="select-all-logs" onchange="toggleAllLogs(this)"> Tout sélectionner (page courante)</label>
            </div>
            ` : ''}
            <div class="table-scroll-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${isAdmin ? '<th style="width:40px;"></th>' : ''}
                            <th>Date &amp; Heure</th>
                            <th>Action</th>
                            <th>Détails</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (paginatedLogs.length > 0) {
        paginatedLogs.forEach(log => {
            tableHTML += `
                <tr>
                    ${isAdmin ? `<td><input type="checkbox" class="log-checkbox" value="${log.id}"></td>` : ''}
                    <td style="color:var(--text-muted); font-size:12px; white-space:nowrap;">
                        ${new Date(log.timestamp || log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td>
                        <span class="badge" style="background:rgba(161,0,87,0.1); color:var(--primary); font-size:10px;">
                            ${(log.action || '').toUpperCase()}
                        </span>
                    </td>
                    <td style="font-weight:500;">${log.details || ''}</td>
                </tr>
            `;
        });
    } else {
        tableHTML += `
            <tr>
                <td colspan="${isAdmin ? '4' : '3'}" style="text-align:center; color:var(--text-muted); padding:40px;">
                    ${historyView === 'trash' ? 'La corbeille est vide.' : 'Aucun historique pour le moment.'}
                </td>
            </tr>
        `;
    }

    tableHTML += `
                    </tbody>
                </table>
            </div>
            <!-- Pagination Controls -->
            ${totalPages > 1 ? `
            <div style="display:flex; justify-content:center; align-items:center; gap:15px; margin-top:20px;">
                <button ${historyCurrentPage === 1 ? 'disabled' : ''} onclick="changeHistoryPage(${historyCurrentPage - 1})" class="btn-secondary" style="width:auto; padding:8px 16px;">Précédent</button>
                <span style="font-size:14px; font-weight:600;">Page ${historyCurrentPage} / ${totalPages}</span>
                <button ${historyCurrentPage === totalPages ? 'disabled' : ''} onclick="changeHistoryPage(${historyCurrentPage + 1})" class="btn-secondary" style="width:auto; padding:8px 16px;">Suivant</button>
            </div>
            ` : ''}
        </div>
    `;

    area.innerHTML = tableHTML;
}

function changeHistoryPage(page) {
    historyCurrentPage = page;
    renderHistoryTable();
}

function toggleAllLogs(checkbox) {
    const checkboxes = document.querySelectorAll('.log-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

async function deleteSelectedLogs() {
    const checkboxes = document.querySelectorAll('.log-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);

    if (ids.length === 0) {
        alert("Veuillez sélectionner au moins un événement à mettre à la corbeille.");
        return;
    }

    if (!confirm(`Voulez-vous vraiment envoyer ${ids.length} élément(s) à la corbeille ?`)) return;

    try {
        const response = await fetch('http://localhost:3000/api/logs/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression");
        
        currentHistoryLogs = currentHistoryLogs.filter(log => !ids.includes(log.id.toString()));
        
        const totalPages = Math.ceil(currentHistoryLogs.length / historyPerPage);
        if (historyCurrentPage > totalPages && totalPages > 0) {
            historyCurrentPage = totalPages;
        }
        renderHistoryTable();
    } catch (e) {
        console.error("Erreur suppression logs:", e);
        alert("Erreur lors de la mise à la corbeille.");
    }
}

async function restoreSelectedLogs() {
    const checkboxes = document.querySelectorAll('.log-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);

    if (ids.length === 0) {
        alert("Veuillez sélectionner au moins un événement à restaurer.");
        return;
    }

    if (!confirm(`Voulez-vous vraiment restaurer ${ids.length} élément(s) de l'historique ?`)) return;

    try {
        const response = await fetch('http://localhost:3000/api/logs/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        if (!response.ok) throw new Error("Erreur lors de la restauration");
        
        currentHistoryLogs = currentHistoryLogs.filter(log => !ids.includes(log.id.toString()));
        
        const totalPages = Math.ceil(currentHistoryLogs.length / historyPerPage);
        if (historyCurrentPage > totalPages && totalPages > 0) {
            historyCurrentPage = totalPages;
        }
        renderHistoryTable();
    } catch (e) {
        console.error("Erreur restauration logs:", e);
        alert("Erreur lors de la restauration.");
    }
}

async function purgeSelectedLogs() {
    const checkboxes = document.querySelectorAll('.log-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);

    if (ids.length === 0) {
        alert("Veuillez sélectionner au moins un événement à supprimer définitivement.");
        return;
    }

    if (!confirm(`ATTENTION : Voulez-vous vraiment supprimer définitivement ${ids.length} élément(s) ? Cette action est irréversible.`)) return;

    try {
        const response = await fetch('http://localhost:3000/api/logs/purge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        if (!response.ok) throw new Error("Erreur lors de la purge");
        
        currentHistoryLogs = currentHistoryLogs.filter(log => !ids.includes(log.id.toString()));
        
        const totalPages = Math.ceil(currentHistoryLogs.length / historyPerPage);
        if (historyCurrentPage > totalPages && totalPages > 0) {
            historyCurrentPage = totalPages;
        }
        renderHistoryTable();
    } catch (e) {
        console.error("Erreur purge logs:", e);
        alert("Erreur lors de la suppression définitive.");
    }
}

// ==========================================================
// 7. ÉVÉNEMENTS & UTILITAIRES
// ==========================================================

/**
 * Initialise tous les écouteurs d'événements de l'interface.
 */
function setupEventListeners() {
    const modal = document.getElementById('task-modal');

    // Bouton flottant + → ouvre la modale d'ajout de tâche
    document.getElementById('open-modal-btn').onclick = () => {
        resetTaskForm();
        modal.style.display = 'flex';
    };

    // Bouton Annuler → ferme la modale
    document.getElementById('close-modal').onclick = () => modal.style.display = 'none';

    // Fermer la modale en cliquant sur le fond sombre
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Soumission du formulaire de tâche
    document.getElementById('task-form').onsubmit = handleTaskSubmit;
    // Soumission du formulaire de profil
    document.getElementById('profile-form').onsubmit = handleProfileSubmit;
    // Suppression de tâche depuis la modale
    document.getElementById('delete-task-btn').onclick = deleteTask;
    // Déconnexion → vide le localStorage et redirige
    document.getElementById('logout-btn').onclick = () => {
        localStorage.clear();
        window.location.href = 'login.html';
    };
}

/**
 * Ouvre la modale en mode édition avec les données d'une tâche existante.
 */
function editTask(task) {
    const modal = document.getElementById('task-modal');
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-assign').value = task.id_assigned || "";
    document.getElementById('delete-task-btn').style.display = "block"; // Montrer le bouton supprimer
    modal.style.display = 'flex';
}

/**
 * Crée ou modifie une tâche selon l'état du formulaire (id présent = modification).
 */
async function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        priority: document.getElementById('task-priority').value,
        id_assigned: document.getElementById('task-assign').value || null
    };

    // PUT si modification, POST si création
    const method = id ? 'PUT' : 'POST';
    const url = id ? `http://localhost:3000/api/tasks/${id}` : 'http://localhost:3000/api/tasks';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('task-modal').style.display = 'none';
            fetchTasks(); // Rafraîchir le tableau
        } else {
            alert("Erreur serveur : " + (data.error || "Impossible d'enregistrer la tâche."));
        }
    } catch (error) {
        alert("Erreur de connexion. Vérifiez que le serveur est lancé.");
    }
}

/**
 * Supprime directement une tâche depuis la corbeille sur la carte.
 */
async function directDeleteTask(id) {
    if (confirm("Supprimer cette tâche définitivement ?")) {
        await fetch(`http://localhost:3000/api/tasks/${id}`, { method: 'DELETE' });
        fetchTasks();
    }
}

/**
 * Supprime la tâche actuellement ouverte dans la modale.
 */
async function deleteTask() {
    const id = document.getElementById('task-id').value;
    await directDeleteTask(id);
    document.getElementById('task-modal').style.display = 'none';
}

// ==========================================================
// 8. DRAWER DE NOTIFICATIONS
// Panneau latéral droit qui s'ouvre/ferme avec overlay sombre
// ==========================================================

/**
 * Ouvre ou ferme le panneau de notifications.
 * L'overlay est affiché en arrière-plan pour permettre
 * de fermer le drawer en cliquant dans l'espace vide.
 */
function toggleNotifDrawer() {
    const drawer = document.getElementById('notif-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const isOpen = drawer.classList.toggle('open');

    // Afficher l'overlay quand le drawer est ouvert, le cacher sinon
    if (overlay) {
        overlay.classList.toggle('active', isOpen);
    }
}

// ==========================================================
// 9. NAVIGATION PRINCIPALE
// ==========================================================

/**
 * Retourne au tableau Kanban principal.
 */
function showKanban() {
    setActiveLink('nav-dashboard');
    document.getElementById('page-title').innerText = "Tableau de bord";

    // Recréer la structure du Kanban (effacée par les autres pages)
    document.getElementById('content-area').innerHTML = `
        <div class="kanban-container" id="kanban-view">
            <div id="kanban-board" class="kanban-board">
                <p style="padding:20px;">Chargement du tableau...</p>
            </div>
        </div>`;

    fetchTasks();
}

/**
 * Charge les utilisateurs dans le select d'assignation des tâches.
 */
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/users');
        const users = await response.json();
        const select = document.getElementById('task-assign');
        if (select) {
            select.innerHTML = '<option value="">Assigner à...</option>' +
                users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
        }
    } catch (e) {
        console.warn("Impossible de charger les utilisateurs pour l'assignation.");
    }
}

/**
 * Active l'élément de navigation sélectionné dans la sidebar.
 * @param {string} id - L'id du <li> nav à activer
 */
function setActiveLink(id) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

/**
 * Vide et réinitialise le formulaire de tâche (mode création).
 */
function resetTaskForm() {
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = "";
    document.getElementById('delete-task-btn').style.display = "none";
}

// ==========================================================
// 10. DRAG & DROP DES TÂCHES
// Glisser une carte entre les colonnes pour changer son statut
// ==========================================================

/** Autorise le drop sur la zone cible. */
function allowDrop(ev) { ev.preventDefault(); }

/** Stocke l'ID de la tâche draggée dans le transfert. */
function drag(ev, id) { ev.dataTransfer.setData("text", id); }

/**
 * Dépose la tâche dans une nouvelle colonne et sauvegarde en base.
 */
async function drop(ev, colId) {
    ev.preventDefault();
    const taskId = ev.dataTransfer.getData("text");
    // Met à jour la colonne de la tâche côté serveur
    await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_col: colId })
    });
    fetchTasks(); // Rafraîchir le tableau après le drop
}

// ==========================================================
// 11. SIDEBAR MOBILE — Burger menu
// Ouvre/ferme la sidebar sur mobile via le bouton ☰
// ==========================================================

/**
 * Bascule l'état ouvert/fermé de la sidebar sur mobile.
 * Ajoute aussi un overlay pour fermer en cliquant à l'extérieur.
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar'); // La sidebar principale
    if (!sidebar) return;

    const isOpen = sidebar.classList.toggle('open'); // Ajoute ou retire la classe 'open'

    // Créer ou supprimer l'overlay de fond pour fermer la sidebar en cliquant dehors
    let overlay = document.getElementById('sidebar-overlay');

    if (isOpen) {
        // Créer l'overlay s'il n'existe pas encore
        if (!overlay) {
            overlay = document.createElement('div'); // Créer un div
            overlay.id = 'sidebar-overlay';           // Lui donner un ID
            // Styles de l'overlay
            overlay.style.cssText = `
                position:fixed; inset:0; z-index:999;
                background:rgba(15,23,42,0.4);
                backdrop-filter:blur(2px);
                cursor:pointer;
            `;
            overlay.onclick = toggleSidebar; // Cliquer dessus ferme la sidebar
            document.body.appendChild(overlay); // L'ajouter au document
        }
    } else {
        // Supprimer l'overlay quand la sidebar se ferme
        if (overlay) overlay.remove();
    }
}


// ==============

/**
 * =========================================================================
 * LUMINA PRO - TABLEAU DE BORD (KANBAN)
 * =========================================================================
 * Ce fichier gère tout ce qui se passe sur la page du tableau de bord :
 * afficher les colonnes, déplacer les tâches avec la souris (Drag & Drop),
 * ouvrir les fenêtres pour créer des tâches, etc.
 * 
 * --- POUR L'EXAMEN (VERSION FACILE À COMPRENDRE) ---
 */

// =========================================================================
// 1. DÉMARRAGE DE LA PAGE
// =========================================================================

/**
 * Cette partie se lance toute seule dès que la page HTML est prête sur l'écran.
 * 
 * Explication simple pour l'examen :
 * 1. DOMContentLoaded : C'est un événement qui dit "Le texte de la page est prêt, on peut commencer à le modifier".
 * 2. Sécurité : Si l'utilisateur n'a pas de ticket (token), on le renvoie direct au login.
 * 3. Rôles (Admin vs Utilisateur normal) : Si l'utilisateur est admin, on lui montre l'onglet "Équipe", 
 *    sinon on le cache.
 */
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    // On récupère le nom de l'utilisateur connecté pour l'afficher en haut
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('user-name').innerText = user.name;

    // Quand on clique sur l'avatar (photo), ça ouvre le profil
    const avatarEl = document.querySelector('.user-info .avatar');
    if (avatarEl) {
        avatarEl.style.cursor = "pointer";
        avatarEl.onclick = showProfile;
    }

    // Cacher ou afficher le menu "Équipe" selon le rôle
    const teamNav = document.getElementById('nav-team');
    if (teamNav) {
        if (user.role === 'admin') {
            teamNav.style.display = 'block'; 
        } else {
            teamNav.style.display = 'none';  
        }
    }

    // On charge les données du tableau
    fetchTasks();          
    loadUsers();           
    setupEventListeners(); 
});

// =========================================================================
// 2. LE TABLEAU KANBAN (COLONNES ET CARTES)
// =========================================================================

/**
 * @brief Va chercher les colonnes et les tâches sur le serveur, puis demande de les afficher.
 * 
 * Explication simple pour l'examen :
 * - async / await (Asynchronisme) : Quand on demande des infos sur internet, ça prend un peu de temps. 
 *   Pour éviter que toute la page se bloque (gèle) pendant l'attente, on utilise `async` et `await`. 
 *   C'est comme envoyer une lettre et continuer à faire sa vie en attendant le facteur.
 * - try / catch (Gestion des erreurs) : Si le serveur est en panne, le code va dans le "catch" 
 *   pour afficher un message d'erreur rouge poli au lieu de tout faire bugger.
 */
async function fetchTasks() {
    try {
        // Demande des colonnes
        const resCol = await authFetch('http://localhost:3000/api/columns');
        const columns = await resCol.json();

        // Demande des tâches
        const resTasks = await authFetch('http://localhost:3000/api/tasks');
        const tasks = await resTasks.json();

        // On dessine le tableau sur l'écran
        renderBoard(columns, tasks);
    } catch (e) {
        console.error("Erreur :", e);
        const board = document.getElementById('kanban-board');
        if (board) {
            board.innerHTML = "<p style='color:red; padding:20px;'>Impossible de se connecter au serveur. Est-il allumé ?</p>";
        }
    }
}

/**
 * @brief Dessine le tableau Kanban (colonnes et cartes de tâches) sur la page.
 * 
 * @param {Array} columns - Les colonnes de la base de données.
 * @param {Array} tasks - Les tâches de la base de données.
 * 
 * Explication simple pour l'examen :
 * - Template Literals (les backticks ``) : Permettent d'écrire du code HTML directement dans le JavaScript.
 * - filter() : Permet de trier les tâches pour ne mettre que les bonnes tâches dans la bonne colonne.
 * - map() : Transforme chaque tâche (donnée) en une jolie boîte visuelle sur l'écran.
 * - join('') : Colle toutes les boîtes ensemble sans virgule entre elles.
 * - Faille XSS (Sécurité) : On nettoie les textes avec `.replace()` pour éviter qu'un utilisateur malveillant 
 *   n'écrive du code informatique bizarre (comme un virus) dans le titre d'une tâche.
 */
function renderBoard(columns, tasks) {
    const board = document.getElementById('kanban-board');
    if (!board) return;
    board.innerHTML = "";

    if (columns.length === 0) {
        board.innerHTML = "<p style='padding:20px;'>Aucune colonne. Cliquez sur le bouton pour en créer une !</p>";
    }

    columns.forEach((col, index) => {
        // Identification des colonnes adjacentes pour les boutons de déplacement
        const prevCol = index > 0 ? columns[index - 1] : null;
        const nextCol = index < columns.length - 1 ? columns[index + 1] : null;

        // On ne garde que les tâches de cette colonne
        const colTasks = tasks.filter(t => t.id_col === col.id);

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.innerHTML = `
            <h4>
                ${col.title.toUpperCase()}
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge" style="position:static; padding:2px 8px; background-color: var(--primary);">${colTasks.length}</span>
                    <span class="icon-btn" title="Renommer" onclick="renameColumn(${col.id}, '${col.title.replace(/'/g, "\\'")}')">✏️</span>
                    <span class="icon-btn" title="Supprimer" onclick="deleteColumn(${col.id})">×</span>
                </div>
            </h4>
            <div class="task-list">
                ${colTasks.map(task => `
                    <div class="task-card">
                        <span class="badge bg-${escapeHTML(task.priority)}">${task.priority === 'high' ? 'URGENT' : task.priority === 'medium' ? 'MOYEN' : 'NORMAL'}</span>
                        <h5>${escapeHTML(task.title)}</h5>
                        <p>${escapeHTML(task.description || '')}</p>
                        <div class="assigned-to">👤 ${escapeHTML(task.assigned_name || 'Non assigné')}</div>
                        
                        <!-- Actions et Boutons de déplacement -->
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
                            <div class="task-move-btns" style="display:flex; gap:5px;">
                                ${prevCol ? `<span class="icon-btn" title="Déplacer à gauche" onclick="moveTask(${task.id}, ${prevCol.id})">⬅️</span>` : `<span style="width:24px; display:inline-block;"></span>`}
                                ${nextCol ? `<span class="icon-btn" title="Déplacer à droite" onclick="moveTask(${task.id}, ${nextCol.id})">➡️</span>` : `<span style="width:24px; display:inline-block;"></span>`}
                            </div>
                            <div class="task-actions" style="margin-top: 0; padding-top: 0; border: none;">
                                <span class="icon-btn" title="Modifier" onclick="editTask(${JSON.stringify(task).replace(/"/g, '&quot;')})">✏️</span>
                                <span class="icon-btn" title="Supprimer" onclick="directDeleteTask(${task.id})">🗑️</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        board.appendChild(colEl);
    });

    // Bouton ajouter colonne à la fin
    const addBtn = document.createElement('div');
    addBtn.className = 'btn-add-column';
    addBtn.onclick = addNewColumn;
    addBtn.innerHTML = '+ Ajouter une colonne';
    board.appendChild(addBtn);
}

/**
 * @brief Demande un nom et crée une nouvelle colonne.
 */
async function addNewColumn() {
    const title = prompt("Quel nom pour la nouvelle colonne ?");
    if (title && title.trim()) {
        try {
            const res = await authFetch('http://localhost:3000/api/columns', {
                method: 'POST',
                body: JSON.stringify({ title: title.trim() })
            });
            if (!res.ok) {
                const data = await res.json();
                alert("Erreur: " + (data.error || "Impossible d'ajouter la colonne."));
            } else {
                fetchTasks(); // On recharge le tableau
            }
        } catch (e) {
            console.error(e);
            alert("Erreur de connexion. Le serveur est-il allumé ?");
        }
    }
}

/**
 * @brief Supprime une colonne et ses tâches après avoir demandé confirmation.
 */
async function deleteColumn(id) {
    if (confirm("Voulez-vous supprimer cette colonne et ses tâches ?")) {
        await authFetch(`http://localhost:3000/api/columns/${id}`, { 
            method: 'DELETE' 
        });
        fetchTasks();
    }
}

/**
 * @brief Change le nom d'une colonne.
 */
async function renameColumn(id, currentTitle) {
    const newTitle = prompt("Nouveau nom de la colonne :", currentTitle);
    if (newTitle && newTitle !== currentTitle) {
        await authFetch(`http://localhost:3000/api/columns/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title: newTitle })
        });
        fetchTasks();
    }
}

// =========================================================================
// 7. GESTION DES CLICS ET BOUTONS
// =========================================================================

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

    // Fermer TOUTES les modales si on clique dans le vide (à côté de la fenêtre)
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
 * @brief Remplir la fenêtre d'édition d'une tâche avec les données existantes.
 */
function editTask(task) {
    const modal = document.getElementById('task-modal');
    if (!modal) return;

    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description || "";
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-assign').value = task.id_assigned || "";

    // On montre le bouton supprimer parce que la tâche existe déjà
    document.getElementById('delete-task-btn').style.display = "block";
    
    modal.style.display = 'flex';
}

/**
 * @brief Envoie une tâche à créer (POST) ou à modifier (PUT) au serveur.
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

    // Si on a un ID → modification (PUT), sinon → création (POST)
    const method = id ? 'PUT' : 'POST';
    const url = id ? `http://localhost:3000/api/tasks/${id}` : 'http://localhost:3000/api/tasks';

    try {
        const response = await authFetch(url, {
            method,
            body: JSON.stringify(taskData)
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('task-modal').style.display = 'none'; 
            fetchTasks(); 
        } else {
            alert("Erreur : " + (data.error || "Impossible de sauvegarder."));
        }
    } catch (error) {
        alert("Erreur de connexion avec le serveur.");
    }
}

/** Supprime une tâche. */
async function directDeleteTask(id) {
    if (confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
        await authFetch(`http://localhost:3000/api/tasks/${id}`, { 
            method: 'DELETE' 
        });
        fetchTasks();
    }
}

/** Supprime la tâche ouverte dans la fenêtre. */
async function deleteTask() {
    const id = document.getElementById('task-id').value;
    if (id) {
        await directDeleteTask(id);
        document.getElementById('task-modal').style.display = 'none';
    }
}

// =========================================================================

// =========================================================================
// 9. OUTILS DIVERS
// =========================================================================

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

// =========================================================================
// 10. DÉPLACEMENT DES TÂCHES (FLÈCHES)
// =========================================================================

/**
 * @brief Déplace une tâche vers une colonne adjacente.
 * Remplace l'ancien Drag & Drop pour simplifier le code et l'expérience utilisateur.
 */
async function moveTask(taskId, newColId) {
    try {
        await authFetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ id_col: newColId })
        });
        fetchTasks(); // On rafraîchit l'affichage pour voir le mouvement
    } catch (e) {
        alert("Erreur lors du déplacement de la tâche.");
    }
}

// =========================================================================
// 11. VERSION MOBILE
// =========================================================================

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



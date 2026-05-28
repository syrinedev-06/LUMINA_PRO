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

    columns.forEach(col => {
        // On ne garde que les tâches de cette colonne
        const colTasks = tasks.filter(t => t.id_col === col.id);

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.innerHTML = `
            <h4>
                ${col.title.toUpperCase()}
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="notif-badge" style="position:static; padding:2px 8px;">${colTasks.length}</span>
                    <span class="icon-btn" title="Renommer" onclick="renameColumn(${col.id}, '${col.title.replace(/'/g, "\\'")}')">✏️</span>
                    <span class="icon-btn" title="Supprimer" onclick="deleteColumn(${col.id})">×</span>
                </div>
            </h4>
            <!-- Zone où on peut déposer les cartes (drop) -->
            <div class="task-list" ondragover="allowDrop(event)" ondrop="drop(event, ${col.id})">
                ${colTasks.map(task => `
                    <!-- Carte déplaçable (draggable="true") -->
                    <div class="task-card" draggable="true" ondragstart="drag(event, ${task.id})">
                        <span class="badge bg-${escapeHTML(task.priority)}">${task.priority === 'high' ? 'URGENT' : task.priority === 'medium' ? 'MOYEN' : 'NORMAL'}</span>
                        <h5>${escapeHTML(task.title)}</h5>
                        <p>${escapeHTML(task.description || '')}</p>
                        <div class="assigned-to">👤 ${escapeHTML(task.assigned_name || 'Non assigné')}</div>
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
// 0. SÉCURITÉ : NETTOYEUR XSS
// =========================================================================
/**
 * @brief Nettoie le texte pour éviter l'exécution de code malveillant (Faille XSS).
 * C'est notre bouclier protecteur quand on affiche du texte venant des utilisateurs.
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// =========================================================================
// 0. BIS. LE PASSE-PARTOUT POUR LES REQUÊTES (JWT)
// =========================================================================

/**
 * @brief Cette fonction fait des demandes au serveur en lui montrant notre "badge de connexion" (le Token JWT).
 * 
 * @param {string} url - L'adresse du serveur à qui on demande des infos.
 * @param {Object} options - Les détails de la demande (ajouter du texte, supprimer...).
 * 
 * Explication simple pour l'examen :
 * 1. C'est quoi le Token JWT ? 
 *    C'est comme un bracelet ou un ticket d'entrée pour un concert. Une fois connecté, le serveur 
 *    nous donne ce ticket. À chaque fois qu'on lui demande une info (comme "donne-moi les tâches"), 
 *    on lui montre ce ticket dans l'en-tête (Header) de notre demande.
 * 2. Pourquoi faire cette fonction ?
 *    Pour éviter de réécrire le code du ticket sur chaque demande. Cette fonction le fait 
 *    automatiquement à notre place.
 * 3. Erreur 401 (Non autorisé) :
 *    Si le serveur dit "erreur 401", ça veut dire que notre ticket n'est plus bon (périmé). 
 *    Dans ce cas, on vide la mémoire et on renvoie l'utilisateur à la page de connexion.
 */
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!options.headers) {
        options.headers = {};
    }
    
    // Si on a le ticket, on l'ajoute à la demande
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Si on envoie du texte, on précise que c'est du JSON (format informatique simple)
    if (options.body && typeof options.body === 'string' && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, options);
    
    // Si le ticket est faux ou expiré
    if (response.status === 401) {
        localStorage.clear(); 
        window.location.href = 'login.html'; 
        throw new Error("Session finie. Retour à la page de connexion.");
    }
    
    return response;
}

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

    columns.forEach(col => {
        // On ne garde que les tâches de cette colonne
        const colTasks = tasks.filter(t => t.id_col === col.id);

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.innerHTML = `
            <h4>
                ${col.title.toUpperCase()}
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="notif-badge" style="position:static; padding:2px 8px;">${colTasks.length}</span>
                    <span class="icon-btn" title="Renommer" onclick="renameColumn(${col.id}, '${col.title.replace(/'/g, "\\'")}')">✏️</span>
                    <span class="icon-btn" title="Supprimer" onclick="deleteColumn(${col.id})">×</span>
                </div>
            </h4>
            <!-- Zone où on peut déposer les cartes (drop) -->
            <div class="task-list" ondragover="allowDrop(event)" ondrop="drop(event, ${col.id})">
                ${colTasks.map(task => `
                    <!-- Carte déplaçable (draggable="true") -->
                    <div class="task-card" draggable="true" ondragstart="drag(event, ${task.id})">
                        <span class="badge bg-${escapeHTML(task.priority)}">${task.priority === 'high' ? 'URGENT' : task.priority === 'medium' ? 'MOYEN' : 'NORMAL'}</span>
                        <h5>${escapeHTML(task.title)}</h5>
                        <p>${escapeHTML(task.description || '')}</p>
                        <div class="assigned-to">👤 ${escapeHTML(task.assigned_name || 'Non assigné')}</div>
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
// 3. LES STATISTIQUES (LE GRAPHIQUE)
// =========================================================================

/**
 * @brief Récupère les données et dessine un graphique en camembert.
 * 
 * Explication simple pour l'examen :
 * - Canvas : C'est une zone de dessin sur la page web.
 * - Chart.js : Une boîte à outils (bibliothèque) toute prête qui prend nos chiffres et dessine 
 *   un beau graphique coloré sans qu'on ait besoin de tout coder à la main.
 * - reduce() : Une fonction qui permet de faire des calculs sur une liste (ici, on compte le total 
 *   de tâches pour voir s'il y a quelque chose à afficher).
 */
async function showStats() {
    document.getElementById('open-modal-btn').style.display = 'none';
    setActiveLink('nav-stats');
    document.getElementById('page-title').innerText = "Statistiques de Productivité";
    const area = document.getElementById('content-area');

    area.innerHTML = `
        <div class="stats-card">
            <h3 style="margin-bottom:25px; color:var(--dark);">Répartition des Missions</h3>
            <div style="position: relative; height:300px;">
                <canvas id="priorityChart"></canvas>
            </div>
            <p id="no-data-msg" style="display:none; margin-top:20px; color:var(--text-muted);">Aucune tâche à analyser pour le moment.</p>
        </div>`;

    try {
        const response = await authFetch("http://localhost:3000/api/stats/tasks-priority");
        const data = await response.json();

        // On calcule la somme des tâches
        const total = data.reduce((acc, curr) => acc + curr.count, 0);
        if (total === 0) {
            document.getElementById('no-data-msg').style.display = 'block';
            return;
        }

        const ctx = document.getElementById("priorityChart").getContext("2d");
        
        // On crée le graphique Chart.js
        new Chart(ctx, {
            type: "pie",
            data: {
                labels: data.map(d => d.priority === 'high' ? 'Urgent' : d.priority === 'medium' ? 'Moyen' : 'Normal'),
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
                    legend: { 
                        position: 'bottom', 
                        labels: { padding: 20, font: { family: 'Inter', size: 14 } } 
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erreur stats :", error);
        area.innerHTML = "<p style='text-align:center; padding:50px;'>Erreur lors du chargement des statistiques.</p>";
    }
}

// =========================================================================
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
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        document.getElementById('content-area').innerHTML =
            "<p style='text-align:center; padding:60px; color:var(--text-muted);'>⛔ Accès interdit. Vous devez être administrateur.</p>";
        return;
    }

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
                                        <span class="icon-btn" style="color:var(--danger); opacity:1;" title="Retirer" onclick="deleteUser(${u.id})">🗑️</span>
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
// 6. L'HISTORIQUE ET LA CORBEILLE (PAGINÉ)
// =========================================================================

// Variables pour savoir ce qu'on affiche dans l'historique
let currentHistoryLogs = []; // La liste de tous les événements
let historyCurrentPage = 1;  // La page courante
const historyPerPage = 10;   // Limite à 10 lignes par page
let historyView = 'active';  // Bascule entre historique normal et corbeille

/**
 * @brief Va chercher l'historique sur le serveur.
 */
async function showHistory(page = 1, view = 'active') {
    setActiveLink('nav-history');
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = "Historique & Corbeille";

    historyView = view;
    historyCurrentPage = page;
    const area = document.getElementById('content-area');
    
    area.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted);">⏳ Chargement en cours...</div>`;
    
    try {
        const endpoint = historyView === 'trash' ? 'http://localhost:3000/api/logs/trash' : 'http://localhost:3000/api/logs';
        const response = await authFetch(endpoint);
        
        if (!response.ok) throw new Error(`Erreur`);
        
        currentHistoryLogs = await response.json();
        renderHistoryTable(); 
    } catch (e) {
        console.error(e);
        area.innerHTML = "<p style='text-align:center; padding:50px; color:red;'>Impossible de charger l'historique.</p>";
    }
}

/**
 * @brief Affiche la liste d'historique sous forme de tableau.
 * 
 * Explication simple pour l'examen (Algorithme de pagination) :
 * - Comment afficher seulement 10 éléments à la fois ?
 *   1. On calcule le début : `start = (numéro_de_page - 1) * 10`.
 *   2. On calcule la fin : `end = start + 10`.
 *   3. On coupe la liste avec `slice(start, end)` pour n'afficher que cette portion.
 *   4. On calcule le total de pages nécessaires avec `Math.ceil(total / 10)` (arrondi vers le haut).
 */
function renderHistoryTable() {
    const area = document.getElementById('content-area');
    
    const start = (historyCurrentPage - 1) * historyPerPage;
    const end = start + historyPerPage;
    const paginatedLogs = currentHistoryLogs.slice(start, end);
    const totalPages = Math.ceil(currentHistoryLogs.length / historyPerPage);

    const user = JSON.parse(localStorage.getItem('user'));
    // On force isAdmin à true ici pour que tout le monde ait accès à la corbeille et aux cases à cocher
    const isAdmin = true;

    let tableHTML = `
        <div style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:10px; margin-left:30px; margin-right:30px; margin-top:20px;">
            <button onclick="showHistory(1, 'active')" style="background:none; border:none; padding:8px 16px; font-weight:600; font-size:14px; cursor:pointer; color: ${historyView === 'active' ? 'var(--primary)' : '#64748b'}; border-bottom: 2px solid ${historyView === 'active' ? 'var(--primary)' : 'transparent'};">📜 Historique actif</button>
            <button onclick="showHistory(1, 'trash')" style="background:none; border:none; padding:8px 16px; font-weight:600; font-size:14px; cursor:pointer; color: ${historyView === 'trash' ? 'var(--primary)' : '#64748b'}; border-bottom: 2px solid ${historyView === 'trash' ? 'var(--primary)' : 'transparent'};">🗑️ Corbeille</button>
        </div>

        <div class="data-card" style="margin-top:10px;">
            ${isAdmin ? `
            <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; gap:10px;">
                    ${historyView === 'active' ? `
                        <button onclick="deleteSelectedLogs()" class="btn-delete" style="width:auto; padding:8px 16px;">Supprimer la sélection</button>
                    ` : `
                        <button onclick="restoreSelectedLogs()" class="btn-primary-modal" style="width:auto; padding:8px 16px; background-color:#10b981; color:white; border:none; border-radius:12px; font-weight:600; cursor:pointer; font-size:14px;">Restaurer la sélection</button>
                        <button onclick="purgeSelectedLogs()" class="btn-delete" style="width:auto; padding:8px 16px; background-color:#ef4444; color:white;">Supprimer définitivement</button>
                    `}
                </div>
                <label style="cursor:pointer; font-size:13px; font-weight:600;">
                    <input type="checkbox" id="select-all-logs" onchange="toggleAllLogs(this)"> Tout sélectionner (page active)
                </label>
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
                    ${historyView === 'trash' ? 'La corbeille est vide.' : 'Aucun événement dans l\'historique.'}
                </td>
            </tr>
        `;
    }

    tableHTML += `
                    </tbody>
                </table>
            </div>
            
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

/** Coche ou décoche toutes les lignes d'un coup. */
function toggleAllLogs(checkbox) {
    const checkboxes = document.querySelectorAll('.log-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

/** Envoie les logs sélectionnés à la corbeille. */
async function deleteSelectedLogs() {
    const checkboxes = document.querySelectorAll('.log-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);

    if (ids.length === 0) {
        alert("Sélectionnez au moins une ligne !");
        return;
    }

    if (!confirm(`Envoyer les ${ids.length} lignes à la corbeille ?`)) return;

    try {
        const response = await authFetch('http://localhost:3000/api/logs/delete', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
        if (!response.ok) throw new Error("Erreur");
        
        currentHistoryLogs = currentHistoryLogs.filter(log => !ids.includes(log.id.toString()));
        
        const totalPages = Math.ceil(currentHistoryLogs.length / historyPerPage);
        if (historyCurrentPage > totalPages && totalPages > 0) {
            historyCurrentPage = totalPages;
        }
        renderHistoryTable();
    } catch (e) {
        alert("Erreur lors de la suppression.");
    }
}

/** Sort les logs de la corbeille. */
async function restoreSelectedLogs() {
    const checkboxes = document.querySelectorAll('.log-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);

    if (ids.length === 0) {
        alert("Sélectionnez au moins une ligne !");
        return;
    }

    if (!confirm(`Restaurer les ${ids.length} lignes ?`)) return;

    try {
        const response = await authFetch('http://localhost:3000/api/logs/restore', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
        if (!response.ok) throw new Error("Erreur");
        
        currentHistoryLogs = currentHistoryLogs.filter(log => !ids.includes(log.id.toString()));
        
        const totalPages = Math.ceil(currentHistoryLogs.length / historyPerPage);
        if (historyCurrentPage > totalPages && totalPages > 0) {
            historyCurrentPage = totalPages;
        }
        renderHistoryTable();
    } catch (e) {
        alert("Erreur lors de la restauration.");
    }
}

/** Supprime les logs de la base de données pour toujours. */
async function purgeSelectedLogs() {
    const checkboxes = document.querySelectorAll('.log-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);

    if (ids.length === 0) {
        alert("Sélectionnez au moins une ligne !");
        return;
    }

    if (!confirm(`⚠️ Attention : Supprimer définitivement ${ids.length} ligne(s) ? C'est irréversible !`)) return;

    try {
        const response = await authFetch('http://localhost:3000/api/logs/purge', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
        if (!response.ok) throw new Error("Erreur");
        
        currentHistoryLogs = currentHistoryLogs.filter(log => !ids.includes(log.id.toString()));
        
        const totalPages = Math.ceil(currentHistoryLogs.length / historyPerPage);
        if (historyCurrentPage > totalPages && totalPages > 0) {
            historyCurrentPage = totalPages;
        }
        renderHistoryTable();
    } catch (e) {
        alert("Erreur lors de la suppression définitive.");
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
// 8. LE TIROIR DES ALERTES (NOTIFICATIONS)
// =========================================================================

/**
 * @brief Ouvre ou ferme le volet des alertes à droite en ajoutant/enlevant une classe CSS.
 */
function toggleNotifDrawer() {
    const drawer = document.getElementById('notif-drawer');
    const overlay = document.getElementById('drawer-overlay');
    
    if (!drawer) return;
    const isOpen = drawer.classList.toggle('open');

    if (overlay) {
        overlay.classList.toggle('active', isOpen);
    }
}

/**
 * @brief Marque une notification comme lue et décrémente le compteur.
 */
function readNotification(element) {
    if (element.classList.contains('unread')) {
        element.classList.remove('unread');
        
        // Mettre à jour le badge
        const badge = document.querySelector('.notif-badge');
        if (badge) {
            let count = parseInt(badge.innerText);
            if (!isNaN(count) && count > 0) {
                count--;
                badge.innerText = count;
                if (count === 0) {
                    badge.style.display = 'none';
                }
            }
        }
    }
}

/**
 * @brief Ajoute une notification de test (pour l'examen).
 */
function addMockNotif() {
    const list = document.getElementById('notif-list');
    const badge = document.querySelector('.notif-badge');
    const newNotif = document.createElement('div');
    newNotif.className = 'notif-item unread';
    newNotif.onclick = function() { readNotification(this); };
    newNotif.innerHTML = `
        <div class="notif-icon">🔥</div>
        <div class="notif-text">
            <strong>Système</strong> a généré une alerte de test pour l'examen.
            <span class="notif-time">À l'instant</span>
        </div>
    `;
    list.prepend(newNotif);
    
    // Mettre à jour le badge
    if (badge) {
        let count = parseInt(badge.innerText) || 0;
        count++;
        badge.innerText = count;
        badge.style.display = 'inline-block';
    }
}

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
// 10. DRAG & DROP (GLISSER-DÉPOSER)
// =========================================================================

/**
 * Autorise le fait de pouvoir lâcher un élément ici.
 * Par défaut, le navigateur interdit de lâcher des éléments sur la page. 
 * preventDefault() lève cette interdiction.
 */
function allowDrop(ev) { 
    ev.preventDefault(); 
}

/**
 * Mémorise l'ID de la tâche que l'on commence à glisser.
 */
function drag(ev, id) { 
    ev.dataTransfer.setData("text", id); 
}

/**
 * Dépose la tâche dans sa nouvelle colonne et l'enregistre sur le serveur.
 */
async function drop(ev, colId) {
    ev.preventDefault();
    const taskId = ev.dataTransfer.getData("text");
    
    // On dit au serveur que la tâche a changé de colonne
    await authFetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ id_col: colId })
    });
    
    fetchTasks(); 
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

/**
 * @brief Bascule le mode sombre.
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    // Mettre à jour le design du toggle-switch (on utilise une checkbox maintenant)
    const toggleCheckbox = document.getElementById('theme-toggle-checkbox');
    if (toggleCheckbox) {
        toggleCheckbox.checked = isDark;
    }
}

// Initialisation du mode sombre au chargement
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const toggleCheckbox = document.getElementById('theme-toggle-checkbox');
        if (toggleCheckbox) toggleCheckbox.checked = true;
    }
});

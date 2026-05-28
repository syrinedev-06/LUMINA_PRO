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
                    <span class="badge" style="position:static; padding:2px 8px; background-color: var(--primary); color: #000000; font-weight: 900;">${colTasks.length}</span>
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






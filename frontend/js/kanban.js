// ==============

/**
 * =========================================================================
 * LUMINA PRO - TABLEAU DE BORD (KANBAN)
 * =========================================================================
 */

// Données globales (chargées une fois, réutilisées pour la recherche)
let allTasks = [];
let allColumns = [];

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
        allColumns = await resCol.json();

        // Demande des tâches
        const resTasks = await authFetch('http://localhost:3000/api/tasks');
        allTasks = await resTasks.json();

        // On dessine les statistiques et le tableau
        renderBoard(allColumns, allTasks);
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

    // Récupération du profil de l'utilisateur connecté pour adapter l'affichage
    // selon son rôle (admin vs user) — sécurité côté serveur déjà vérifiée par verifyToken
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const isAdmin = currentUser.role === 'admin';

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
            <h3>
                <span style="display:flex; align-items:center; gap:8px;">
                    ${escapeHTML(col.title)}
                    <span style="background:rgba(0,0,0,0.15); color:inherit; font-size:12px; font-weight:700; padding:2px 8px; border-radius:20px; min-width:24px; text-align:center;">${colTasks.length}</span>
                </span>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${isAdmin ? `
                        <button type="button" class="icon-btn" aria-label="Renommer la colonne ${escapeHTML(col.title)}" onclick="renameColumn(${col.id}, '${col.title.replace(/'/g, "\\'")}')">✏️</button>
                        <button type="button" class="icon-btn" aria-label="Supprimer la colonne ${escapeHTML(col.title)}" onclick="deleteColumn(${col.id})">×</button>
                    ` : ''}
                </div>
            </h3>
            <div class="task-list">
                ${colTasks.map(task => {
                    let dueBadge = '';
                    let cardBorder = '';
                    if (task.due_date) {
                        const dueDateStr = new Date(task.due_date).toISOString().substring(0, 10);
                        const todayStr = new Date().toISOString().substring(0, 10);
                        const dueDisplay = new Date(dueDateStr + 'T12:00:00').toLocaleDateString('fr-FR');
                        if (dueDateStr < todayStr) {
                            const diffDays = Math.round((new Date(todayStr) - new Date(dueDateStr)) / 86400000);
                            dueBadge = `<div class="badge-overdue">⚠️ En retard de ${diffDays} jour${diffDays > 1 ? 's' : ''}</div>`;
                            cardBorder = 'border-left:3px solid #ef4444;';
                        } else {
                            dueBadge = `<div class="badge-due">📅 ${dueDisplay}</div>`;
                        }
                    }

                    // Un utilisateur peut supprimer seulement sa propre tâche assignée.
                    // L'admin peut tout supprimer.
                    // La même règle est vérifiée côté serveur dans routes/tasks.js (protection IDOR).
                    const canDelete = isAdmin || task.id_assigned === currentUser.id;

                    return `
                    <div class="task-card" style="${cardBorder}">
                        <span class="badge bg-${escapeHTML(task.priority || 'low')}">${task.priority === 'high' ? 'URGENT' : task.priority === 'medium' ? 'MOYEN' : 'NORMAL'}</span>
                        ${dueBadge}
                        <h4>${escapeHTML(task.title)}</h4>
                        <p>${escapeHTML(task.description || '')}</p>
                        <div class="assigned-to">👤 ${escapeHTML(task.assigned_name || 'Non assigné')}</div>

                        <!-- Actions et Boutons de déplacement -->
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
                            <div class="task-move-btns" style="display:flex; gap:5px;">
                                ${prevCol ? `<button type="button" class="icon-btn" aria-label="Déplacer la tâche vers ${escapeHTML(prevCol.title)}" onclick="moveTask(${task.id}, ${prevCol.id})">⬅️</button>` : `<span style="width:24px; display:inline-block;"></span>`}
                                ${nextCol ? `<button type="button" class="icon-btn" aria-label="Déplacer la tâche vers ${escapeHTML(nextCol.title)}" onclick="moveTask(${task.id}, ${nextCol.id})">➡️</button>` : `<span style="width:24px; display:inline-block;"></span>`}
                            </div>
                            <div class="task-actions" style="margin-top: 0; padding-top: 0; border: none;">
                                <button type="button" class="icon-btn" aria-label="Modifier la tâche ${escapeHTML(task.title)}" onclick="editTask(${JSON.stringify(task).replace(/"/g, '&quot;')})">✏️</button>
                                ${canDelete ? `<button type="button" class="icon-btn" aria-label="Supprimer la tâche ${escapeHTML(task.title)}" onclick="directDeleteTask(${task.id})">🗑️</button>` : ''}
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
        board.appendChild(colEl);
    });

    // Bouton "ajouter colonne" — réservé aux admins
    if (isAdmin) {
        const addBtn = document.createElement('div');
        addBtn.className = 'btn-add-column';
        addBtn.onclick = addNewColumn;
        addBtn.innerHTML = '+ Ajouter une colonne';
        board.appendChild(addBtn);
    }
}

// =========================================================================
// 3. RECHERCHE / FILTRE DES TÂCHES
// =========================================================================

/**
 * Filtre les tâches côté client selon le texte saisi dans la barre de recherche.
 * Explication examen : Pas d'appel serveur — on filtre le tableau JavaScript déjà
 * chargé en mémoire avec Array.filter() et on redessine le board avec le résultat.
 */
function filterTasks() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    if (query === '') {
        renderBoard(allColumns, allTasks);
        return;
    }
    const filtered = allTasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query)
    );
    renderBoard(allColumns, filtered);
}






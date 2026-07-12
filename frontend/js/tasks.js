/**
 * =========================================================================
 * MODULE : GESTION DES TÂCHES
 * =========================================================================
 * Ce fichier gère la création, modification, suppression et déplacement des tâches.
 */

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
    const dueEl = document.getElementById('task-due');
    if (dueEl) dueEl.value = task.due_date ? new Date(task.due_date).toISOString().substring(0, 10) : "";

    // Le bouton supprimer dans la modale n'est visible que si l'utilisateur
    // a le droit de supprimer cette tâche (admin ou tâche assignée à soi-même).
    // La même règle est vérifiée côté serveur — c'est une sécurité UX, pas la vraie protection.
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const canDelete = currentUser.role === 'admin' || task.id_assigned === currentUser.id;
    document.getElementById('delete-task-btn').style.display = canDelete ? "block" : "none";

    modal.style.display = 'flex';
}

/**
 * @brief Envoie une tâche à créer (POST) ou à modifier (PUT) au serveur.
 */
async function saveTask() {
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const priority = document.getElementById('task-priority').value;
    const id_assigned = document.getElementById('task-assign').value || null;
    const dueEl = document.getElementById('task-due');
    const due_date = dueEl && dueEl.value ? dueEl.value : null;

    if (!title) { alert("Le titre est obligatoire."); return; }

    const taskData = { title, description, priority, id_assigned, due_date };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `http://localhost:3000/api/tasks/${id}` : 'http://localhost:3000/api/tasks';

    try {
        const response = await authFetch(url, { method, body: JSON.stringify(taskData) });
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

async function handleTaskSubmit(e) {
    if (e) e.preventDefault();
    saveTask();
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

/** Supprime la tâche ouverte dans la fenêtre modale. */
async function deleteTask() {
    const id = document.getElementById('task-id').value;
    if (id) {
        await directDeleteTask(id);
        document.getElementById('task-modal').style.display = 'none';
    }
}

/**
 * @brief Déplace une tâche vers une colonne adjacente.
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

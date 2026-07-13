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

    // On ne montre le bouton supprimer que si l'utilisateur a le droit de supprimer cette tâche :
    // un admin peut tout supprimer, un utilisateur standard seulement ses propres tâches assignées.
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const canDelete = currentUser.role === 'admin' || task.id_assigned === currentUser.id;
    document.getElementById('delete-task-btn').style.display = canDelete ? "block" : "none";
    
    modal.style.display = 'flex';
}

/**
 * @brief Envoie une tâche à créer (POST) ou à modifier (PUT) au serveur.
 */
async function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const titleInput = document.getElementById('task-title');
    const titleError = document.getElementById('task-title-error');

    if (!titleInput.value.trim()) {
        titleError.style.display = 'block';
        titleInput.setAttribute('aria-invalid', 'true');
        titleInput.focus();
        return;
    }
    titleError.style.display = 'none';
    titleInput.removeAttribute('aria-invalid');

    const taskData = {
        title: titleInput.value.trim(),
        description: document.getElementById('task-desc').value,
        priority: document.getElementById('task-priority').value,
        id_assigned: document.getElementById('task-assign').value || null,
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
        const response = await authFetch(`http://localhost:3000/api/tasks/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            alert("Erreur : " + (data.error || "Suppression impossible."));
        }
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

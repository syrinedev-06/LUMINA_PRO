/**
 * =========================================================================
 * MODULE : GESTION DES COLONNES
 * =========================================================================
 * Ce fichier gère la création, modification et suppression des colonnes.
 */

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

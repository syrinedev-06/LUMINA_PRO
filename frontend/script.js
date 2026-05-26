/**
 * =========================================================================
 * LUMINA PRO - ANCIEN SCRIPT (LEGACY - SANS SÉCURITÉ)
 * =========================================================================
 * Fichier : script.js (Ancienne version)
 * Rôle : Ce fichier montre comment l'application marchait AVANT.
 *        Il y a beaucoup d'erreurs et de pièges de sécurité ici.
 * 
 * --- POUR L'EXAMEN (VERSION TRÈS FACILE À COMPRENDRE) ---
 */

// 1. LE PIÈGE DE SÉCURITÉ : FAIRE CONFIANCE AU NAVIGATEUR
/**
 * Explication simple pour l'examen :
 * - Ce code récupère l'utilisateur depuis la mémoire locale (LocalStorage) et dit : 
 *   "Si c'est marqué 'admin' dans sa mémoire, alors c'est l'administrateur".
 * - Pourquoi c'est un énorme piège de sécurité ?
 *   N'importe qui peut ouvrir la console du navigateur (F12), modifier la ligne de mémoire 
 *   pour y écrire `role: "admin"` et recharger la page. L'application va croire que c'est l'admin !
 * - La vraie sécurité doit TOUJOURS être faite sur le serveur (le backend) avec un ticket JWT 
 *   signé de manière cryptographique et vérifié à chaque action.
 */
let user = JSON.parse(localStorage.getItem('user'));

if (user && (!user.email || !user.role)) {
    console.warn("Session abîmée, nettoyage...");
    localStorage.clear();
    user = null;
}

if (!user) {
    user = { name: "Utilisateur temporaire", email: "non-connecté@lumina.fr", role: "user" };
}

// 2. LE TIROIR LOCAL POUR LE JOURNAL D'ACTIVITÉ
/**
 * Explication simple pour l'examen :
 * - Enregistrer l'historique dans le LocalStorage est une mauvaise idée :
 *   1. Non partagé : Seul l'utilisateur voit son propre historique sur son ordinateur. 
 *      Si son collègue change un truc, il n'est pas au courant.
 *   2. Facile à tricher : L'utilisateur peut modifier ou vider sa mémoire locale à tout moment 
 *      pour cacher ses bêtises.
 *   3. Panne de mémoire : Le LocalStorage est très limité en place (5 Mo). Si l'historique devient 
 *      trop gros, tout s'arrête.
 * - Solution : Envoyer les actions sur le serveur pour les enregistrer dans une vraie base de données.
 */
let journal = JSON.parse(localStorage.getItem('journal')) || [];

// 3. CODE DE DÉMARRAGE DE LA PAGE
document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('username-display');
    if (display) display.innerText = `👤 ${user.name} (${user.role})`;
    
    // On cache le bouton Équipe si le rôle n'est pas admin (sécurité visuelle fragile)
    const menuEquipe = document.getElementById('menu-equipe');
    const role = (user.role || "").toLowerCase();
    if (menuEquipe && role !== 'admin') {
        menuEquipe.style.display = 'none';
    }

    chargerMembresDansModale();
    chargerNotifs();
    afficherBoard();

    // Fermer le volet d'alertes en cliquant ailleurs
    window.onclick = function(event) {
        const dropdown = document.getElementById('notif-dropdown');
        const bell = document.querySelector('.notif-bell');
        if (dropdown && !dropdown.contains(event.target) && !bell.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    }
});

// 4. LES ALERTES (SANS SÉCURITÉ)
async function toggleNotifs() {
    const dropdown = document.getElementById('notif-dropdown');
    const isHidden = dropdown.style.display === 'none';
    dropdown.style.display = isHidden ? 'block' : 'none';
    
    if (isHidden) {
        await chargerNotifs();
    }
}

/**
 * Explication simple pour l'examen :
 * - Ici, on fait `fetch('http://localhost:3000/notifications')` sans ticket JWT (sans en-tête d'autorisation).
 * - N'importe qui sur internet peut taper cette adresse et lire toutes les alertes privées 
 *   du site sans s'inscrire ni se connecter ! C'est une faille de contrôle d'accès.
 */
async function chargerNotifs() {
    try {
        const res = await fetch('http://localhost:3000/notifications');
        const notifs = await res.json();
        const list = document.getElementById('notif-list');
        if (notifs.length === 0) {
            list.innerHTML = '<p style="color: gray; font-size: 14px;">Aucune alerte.</p>';
        } else {
            list.innerHTML = notifs.map(n => `
                <div class="notif-item" style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px;">
                    <strong>${new Date(n.date).toLocaleTimeString('fr-FR')}</strong>: ${n.message}
                </div>
            `).join('');
        }
    } catch (e) { 
        console.error("Erreur alertes", e); 
    }
}

function preparerVue(titre) {
    document.getElementById('page-title').innerText = titre;
    document.getElementById('dynamic-view').innerHTML = "";
}

// -------------------------------------------------------------------------
// --- SECTION KANBAN ET GLISSER-DÉPOSER (DRAG & DROP)
// -------------------------------------------------------------------------

async function afficherBoard() {
    preparerVue("Tableau de bord");
    const container = document.getElementById('dynamic-view');
    container.innerHTML = "<p>Connexion au serveur...</p>";

    try {
        // Promise.all : On lance les deux demandes en même temps pour aller plus vite (gain de temps)
        const [resTasks, resCols] = await Promise.all([
            fetch('http://localhost:3000/tasks'),
            fetch('http://localhost:3000/columns')
        ]);

        if (!resTasks.ok || !resCols.ok) throw new Error("Erreur");
        
        const taches = await resTasks.json();
        const colonnes = await resCols.json();

        let html = `<div class="kanban-wrapper" style="display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px;">`;

        colonnes.forEach(col => {
            const tachesCol = (taches || []).filter(t => t.id_col == col.id_col);
            html += `<div class="kanban-column" id="col-${col.id_col}" ondragover="allowDrop(event)" ondrop="drop(event)" style="background: #ebedf0; padding: 15px; border-radius: 8px; min-width: 280px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin:0;">${col.title} (${tachesCol.length})</h4>
                            <span onclick="supprimerColonne(${col.id_col})" style="cursor:pointer; color:#e74c3c; font-weight:bold; font-size:18px;" title="Supprimer">×</span>
                        </div>`;

            tachesCol.forEach(t => {
                let bordure = t.priority === 'urgent' ? '#e74c3c' : (t.priority === 'important' ? '#f39c12' : '#27ae60');
                html += `
                <div class="task-card" id="task-${t.id_task}" draggable="true" ondragstart="drag(event)" style="background: white; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 5px solid ${bordure}; cursor: grab;">
                    <h4 style="margin:0 0 10px 0;">${t.title}</h4>
                    <span class="badge bg-${t.priority || 'normal'}">${(t.priority || 'NORMAL').toUpperCase()}</span>
                    <p style="font-size:12px; margin-top:10px; color:gray;">👤 ${t.assigned_name || 'Non assigné'}</p>
                </div>`;
            });
            html += `</div>`;
        });
        html += `</div>`;
        container.innerHTML = html;
    } catch (e) { 
        container.innerHTML = `<p style="color:red;">⚠️ Erreur. L'API backend est-elle allumée ?</p>`; 
    }
}

function allowDrop(e) { e.preventDefault(); }
function drag(e) { e.dataTransfer.setData("text", e.currentTarget.id); }

/**
 * Explication simple pour l'examen (Annulation graphique en cas d'erreur) :
 * - Si on déplace une carte mais que le serveur renvoie une erreur (par exemple si internet coupe), 
 *   le code remet automatiquement la carte dans son ancienne colonne avec `oldCol.appendChild(carte)`. 
 *   C'est un mécanisme d'annulation (Rollback) pour éviter que l'écran mente à l'utilisateur.
 */
async function drop(e) {
    e.preventDefault();
    const elementId = e.dataTransfer.getData("text");
    const carte = document.getElementById(elementId);
    const colonne = e.currentTarget.closest('.kanban-column');

    if (colonne && carte) {
        const oldCol = carte.parentElement;
        colonne.appendChild(carte);
        const id_task = elementId.replace('task-', '');
        const id_col = colonne.id.replace('col-', '');

        try {
            const res = await fetch('http://localhost:3000/tasks/update-col', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_task, id_col })
            });
            if (!res.ok) throw new Error();
            
            enregistrerDansJournal("Déplacement", carte.querySelector('h4').innerText);
            chargerNotifs();
        } catch (err) {
            oldCol.appendChild(carte); // On remet la carte à sa place de départ en cas d'erreur
            alert("Erreur de sauvegarde.");
        }
    }
}

// -------------------------------------------------------------------------
// --- GESTION DES TÂCHES
// -------------------------------------------------------------------------

async function chargerMembresDansModale() {
    try {
        const res = await fetch('http://localhost:3000/users');
        const membres = await res.json();
        const select = document.getElementById('task-assign');
        if (select) {
            select.innerHTML = '<option value="">Choisir un membre...</option>';
            membres.forEach(m => {
                select.innerHTML += `<option value="${m.id_user}">${m.name}</option>`;
            });
        }
    } catch (e) { 
        console.log("Erreur membres"); 
    }
}

function ouvrirModale() { document.getElementById('modal-task').style.display = "flex"; }
function fermerModale() { document.getElementById('modal-task').style.display = "none"; }

async function validerTache() {
    const titre = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const assigne = document.getElementById('task-assign').value;
    const priorite = document.getElementById('task-priority').value;

    if (!titre) return alert("Le titre est obligatoire");

    try {
        const res = await fetch('http://localhost:3000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: titre,
                description: desc,
                id_assigned: assigne ? parseInt(assigne) : null,
                priority: priorite,
                id_col: 1 
            })
        });

        if (res.ok) {
            enregistrerDansJournal("Création", titre);
            document.getElementById('task-title').value = "";
            document.getElementById('task-desc').value = "";
            fermerModale();
            afficherBoard();
            chargerNotifs();
        } else {
            const err = await res.json();
            alert("Erreur serveur : " + (err.error || "Inconnu"));
        }
    } catch (e) { 
        alert("Erreur serveur !"); 
    }
}

// -------------------------------------------------------------------------
// --- GESTION DES COLONNES
// -------------------------------------------------------------------------

function ouvrirModaleColonne() { document.getElementById('modal-col').style.display = "flex"; }
function fermerModaleColonne() { document.getElementById('modal-col').style.display = "none"; }

async function validerColonne() {
    const titre = document.getElementById('col-title').value;
    if (!titre) return alert("Le titre est obligatoire");

    try {
        const res = await fetch('http://localhost:3000/columns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titre })
        });
        if (res.ok) {
            document.getElementById('col-title').value = "";
            fermerModaleColonne();
            afficherBoard();
        }
    } catch (e) { 
        alert("Erreur ajout colonne"); 
    }
}

async function supprimerColonne(id) {
    if (!confirm("Voulez-vous supprimer cette colonne ?")) return;
    try {
        const res = await fetch(`http://localhost:3000/columns/${id}`, { method: 'DELETE' });
        if (res.ok) {
            afficherBoard();
        }
    } catch (e) { 
        alert("Erreur lors de la suppression."); 
    }
}

// -------------------------------------------------------------------------
// --- LE JOURNAL D'ACTIVITÉ LOCAL (PIÈGE DE DÉCOUPE)
// -------------------------------------------------------------------------

/**
 * Explication simple pour l'examen :
 * - Délimiteur pipe (|) : Pour stocker plusieurs infos dans une seule ligne de texte, 
 *   ce vieux script colle les morceaux avec un séparateur vertical `|` (ex: "Création|Tâche A|Bob|Date").
 * - Pourquoi c'est fragile ? 
 *   Si l'utilisateur écrit un titre avec un caractère `|` (comme "Tâche | Urgente"), 
 *   la découpe avec `split('|')` va couper au mauvais endroit. On aura 5 colonnes au lieu de 4, 
 *   ce qui va décaler tout notre tableau et provoquer un bug d'affichage.
 * - Solution : Utiliser du JSON (`JSON.stringify`) ou stocker cela proprement en base de données.
 */
async function ouvrirJournal() {
    preparerVue("Journal des Missions (Mémoire Locale)");
    let html = `<table><tr><th>Date & Heure</th><th>Action</th><th>Mission</th><th>Auteur</th></tr>`;
    
    // slice().reverse() : Copie et inverse la liste pour voir les derniers événements en premier
    journal.slice().reverse().forEach(entree => {
        const infos = entree.split('|');
        if (infos.length === 4) {
            html += `<tr>
                <td style="color: #A10057; font-weight: bold;">${infos[3]}</td>
                <td><b>${infos[0]}</b></td>
                <td>${infos[1]}</td>
                <td>${infos[2]}</td>
            </tr>`;
        }
    });
    html += `</table><br><button class="btn-bleu" onclick="afficherBoard()">← Retour</button>`;
    document.getElementById('dynamic-view').innerHTML = html;
}

function enregistrerDansJournal(action, titreMission) {
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    // On colle les morceaux de texte avec des barres verticales |
    const ligne = `${action}|${titreMission}|${user.name}|${date}`;
    journal.push(ligne);
    localStorage.setItem('journal', JSON.stringify(journal));
}

// -------------------------------------------------------------------------
// --- ÉQUIPE ET PROFIL (LEGACY)
// -------------------------------------------------------------------------

async function ouvrirEquipe() {
    const role = (user.role || "").toLowerCase();
    if (role !== 'admin') return alert("Accès interdit !");
    
    preparerVue("Membres de l'équipe (Vue brute)");
    const container = document.getElementById('dynamic-view');
    try {
        const res = await fetch('http://localhost:3000/users');
        const membres = await res.json();
        let html = `<table><tr><th>Nom</th><th>Rôle</th><th>Email</th><th>Actions</th></tr>`;
        membres.forEach(m => {
            html += `<tr><td>${m.name}</td><td>${m.role}</td><td>${m.email}</td><td>
                    <button class="btn-bleu" style="padding:5px 10px; font-size:12px; background:black;" onclick="modifierMembre(${m.id_user}, '${m.name}', '${m.email}', '${m.role}')">✏️</button>
                    <button class="btn-fushia" style="padding:5px 10px; font-size:12px; background:#e74c3c;" onclick="supprimerMembre(${m.id_user})">🗑️</button>
                </td></tr>`;
        });
        html += `</table><br><button class="btn-bleu" onclick="afficherBoard()">← Retour</button>`;
        container.innerHTML = html;
    } catch (e) { 
        container.innerHTML = "<p style='color:red;'>Erreur serveur.</p>"; 
    }
}

async function supprimerMembre(id) {
    if (!confirm("Supprimer ce membre ?")) return;
    try {
        await fetch(`http://localhost:3000/users/${id}`, { method: 'DELETE' });
        ouvrirEquipe();
    } catch (e) { 
        alert("Erreur de suppression"); 
    }
}

async function modifierMembre(id, nom, email, role) {
    const n = prompt("Nouveau nom :", nom);
    const r = prompt("Nouveau rôle (admin/user) :", role);
    if (n && r) {
        try {
            await fetch(`http://localhost:3000/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: n, email, role: r })
            });
            ouvrirEquipe();
        } catch (e) { 
            alert("Erreur modification"); 
        }
    }
}

function ouvrirProfil() {
    preparerVue("Mon Profil");
    const container = document.getElementById('dynamic-view');
    let html = `
    <div class="profile-card" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 100px; height: 100px; background: #A10057; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 15px;">
                ${(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <h3>${user.name || "Utilisateur"}</h3>
            <p style="color: gray;">${user.role || "rôle inconnu"}</p>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px;">
            <p><strong>📧 Email :</strong> ${user.email || "Non configuré"}</p>
            <p><strong>🏷️ Rôle :</strong> ${user.role || "Non configuré"}</p>
        </div>
        <br>
        <button class="btn-bleu" style="width: 100%;" onclick="afficherBoard()">Retour</button>
    </div>`;
    container.innerHTML = html;
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
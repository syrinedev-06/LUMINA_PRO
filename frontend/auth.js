/**
 * =========================================================================
 * LUMINA PRO - ANCIENNE CONNEXION (LEGACY - SANS SÉCURITÉ)
 * =========================================================================
 * Fichier : auth.js (Ancienne version)
 * Rôle : Ce fichier montre comment on se connectait AVANT d'utiliser 
 *        le système sécurisé avec le ticket JWT.
 * 
 * --- POUR L'EXAMEN (VERSION TRÈS FACILE À COMPRENDRE) ---
 */

const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('register-form');

/**
 * CHANGER DE FORMULAIRE
 * Permet de cacher la connexion pour afficher l'inscription quand on clique sur le lien.
 */
if (document.getElementById('link-to-register')) {
    document.getElementById('link-to-register').onclick = () => {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('register-container').style.display = 'block';
    };
}

/**
 * SE CONNECTER (L'ANCIENNE MÉTHODE)
 * 
 * Explication simple pour l'examen (Pourquoi c'était dangereux) :
 * - Avant : Quand on se connectait, le serveur disait juste "OK, voici tes infos" 
 *   sans donner de vrai ticket infalsifiable (JWT). Le navigateur enregistrait 
 *   ces infos en clair dans sa mémoire (`localStorage`).
 * - Le danger : Si on n'a pas de ticket secret (JWT), à la prochaine action, 
 *   on ne peut pas prouver au serveur que l'on est vraiment connecté de façon sûre.
 * - Le mot de passe : Dans cette vieille version, le mot de passe était vérifié 
 *   tel quel, sans être transformé en bouillie (Bcrypt). C'est très mauvais pour la sécurité !
 */
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault(); 
        
        const res = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-pass').value
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // On enregistre les infos sans protection (dangereux)
            localStorage.setItem('user', JSON.stringify(data));
            
            // Si la case "Se souvenir de moi" est cochée
            if (document.getElementById('remember-me').checked) {
                localStorage.setItem('rememberedEmail', document.getElementById('login-email').value);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            window.location.href = 'index.html'; 
        } else { 
            alert(data.error || "Mauvais email ou mot de passe."); 
        }
    };
}

/**
 * S'INSCRIRE (L'ANCIENNE MÉTHODE)
 * 
 * Explication simple pour l'examen (La vérification du mot de passe) :
 * - C'est quoi un "Regex" ?
 *   C'est une formule mathématique qui vérifie si un texte respecte des règles.
 *   Ici, la formule bizarre `/^(?=.*[a-z])(?=.*[A-Z])...` dit au navigateur :
 *   "Vérifie que le mot de passe a bien une minuscule, une majuscule, un chiffre, 
 *   un caractère spécial, et qu'il fait au moins 8 lettres de long."
 * - L'avantage : Ça dit tout de suite à l'utilisateur si son mot de passe est trop faible, 
 *   sans avoir besoin de demander au serveur.
 * - Le problème : C'est très facile à contourner pour un pirate. Donc il faut TOUJOURS 
 *   revérifier le mot de passe côté serveur (backend) pour être sûr.
 */
if (regForm) {
    regForm.onsubmit = async (e) => {
        e.preventDefault();
        const pass = document.getElementById('reg-pass').value;
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        // On empêche l'inscription si le mot de passe est trop simple
        if (!regex.test(pass)) {
            return alert("Le mot de passe est trop simple. Il faut au moins 8 lettres, avec une majuscule, une minuscule, un chiffre et un caractère spécial.");
        }

        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: pass // Envoi du mot de passe tel quel (non protégé)
            })
        });
        
        if (res.ok) { 
            alert("Compte créé !"); 
            location.reload(); 
        } else {
            const data = await res.json();
            alert(data.error || "Erreur de création de compte.");
        }
    };
}

/**
 * SE SOUVENIR DE MOI
 */
window.onload = () => {
    // On remet l'adresse email dans la case si elle était enregistrée
    const saved = localStorage.getItem('rememberedEmail');
    const emailInput = document.getElementById('login-email');
    if (saved && emailInput) {
        emailInput.value = saved;
    }
};
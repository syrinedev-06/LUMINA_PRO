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
 * 3. Erreur 401 ou 403 :
 *    Le serveur renvoie 401 quand le ticket est absent, et 403 quand il est présent mais invalide
 *    ou expiré (voir backend/middleware/security.js). Dans les deux cas, notre ticket n'est plus bon :
 *    on vide la mémoire et on renvoie l'utilisateur à la page de connexion.
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
    
    // Si le ticket est absent (401) ou invalide/expiré (403)
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = 'login.html';
        throw new Error("Session finie. Retour à la page de connexion.");
    }
    
    return response;
}

// =========================================================================

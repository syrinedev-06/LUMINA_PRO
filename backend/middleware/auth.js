const jwt = require('jsonwebtoken');

// Clé secrète unifiée pour signer et vérifier les jetons JWT.
// NOTE EXAMEN : En production, cette clé doit impérativement être stockée
// dans un fichier d'environnement (.env) non versionné pour des raisons de sécurité.
const SECRET_KEY = "LUMINA_SECRET_2024";

/**
 * @brief Middleware de validation des jetons JWT (JSON Web Tokens).
 * 
 * CONCEPT PÉDAGOGIQUE (Express Middleware) :
 * Un middleware est une fonction intermédiaire qui s'exécute entre la réception 
 * de la requête par le serveur et l'exécution du contrôleur final (la route).
 * Il prend trois paramètres : `req` (requête), `res` (réponse) et `next` (fonction suivante).
 * Appeler `next()` permet de passer le contrôle au middleware suivant. Si on ne l'appelle pas,
 * la requête reste "bloquée".
 * 
 * RÔLE DE CE MIDDLEWARE :
 * 1. Récupérer le header d'autorisation 'Authorization'.
 * 2. Vérifier s'il respecte le format standard "Bearer <token>".
 * 3. Valider la signature et l'expiration du jeton avec la bibliothèque jsonwebtoken.
 * 4. Injecter les données décodées (ID de l'utilisateur, rôle) dans l'objet `req.user`
 *    pour que les contrôleurs suivants puissent identifier qui fait la requête.
 * 
 * @param {Object} req - Objet de requête HTTP d'Express.
 * @param {Object} res - Objet de réponse HTTP d'Express.
 * @param {Function} next - Fonction callback pour passer au middleware ou route suivante.
 * @returns {void} Envoie une réponse d'erreur HTTP (401/403) si le jeton est invalide ou absent, sinon passe au suivant.
 */
function verifyToken(req, res, next) {
    // 1. Extraction du header 'Authorization'
    // NOTE EXAMEN : Les headers HTTP permettent de transmettre des métadonnées sur la requête.
    const authHeader = req.headers['authorization'];
    
    // Le jeton est généralement envoyé sous la forme "Bearer <token>"
    // Si le header n'existe pas, ou ne commence pas par "Bearer ", on rejette la requête.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: "Accès refusé. Jeton d'authentification manquant ou mal formaté." 
        });
    }

    // 2. Récupération du jeton (on sépare "Bearer" et la chaîne du token par l'espace)
    const token = authHeader.split(' ')[1];

    try {
        // 3. Vérification du jeton avec la clé secrète
        // jwt.verify compare la signature du token avec la clé secrète.
        // Si le token a été modifié par un utilisateur malveillant ou s'il est expiré,
        // cette méthode lève (throw) une erreur.
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // 4. Stockage des données décodées dans la requête
        // On attache les infos décodées (ex: { id: 1, role: 'admin' }) à l'objet `req`
        // Ainsi, les routes suivantes auront un accès direct à `req.user`.
        req.user = decoded;
        
        // 5. Poursuite du cycle de la requête
        next();
    } catch (error) {
        // En cas d'erreur (signature invalide, token expiré, etc.)
        // HTTP 403 (Forbidden) : Le serveur comprend la requête mais refuse de l'exécuter.
        return res.status(403).json({ 
            error: "Jeton d'authentification invalide ou expiré." 
        });
    }
}

module.exports = verifyToken;

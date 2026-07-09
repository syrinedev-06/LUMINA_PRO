/**
 * CONFIGURATION DE LA BASE DE DONNÉES (Principe DRY)
 * 
 * NOTE EXAMEN : Au lieu d'écrire ces identifiants dans 5 fichiers différents, 
 * on les centralise ici. Si demain le mot de passe change, on ne le modifie 
 * qu'à un seul endroit. C'est le principe "Don't Repeat Yourself" (DRY).
 */
module.exports = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lumina_pro'
};

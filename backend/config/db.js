/**
 * CONFIGURATION DE LA BASE DE DONNÉES (Principe DRY)
 * 
 * NOTE EXAMEN : Au lieu d'écrire ces identifiants dans 5 fichiers différents, 
 * on les centralise ici. Si demain le mot de passe change, on ne le modifie 
 * qu'à un seul endroit. C'est le principe "Don't Repeat Yourself" (DRY).
 */
module.exports = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lumina_pro'
};

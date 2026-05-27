const mysql = require('mysql2');

/**
 * CONCEPTS EXAMEN :
 * - **Script administratif de secours** : Outil utilisé hors production ou en maintenance 
 *   pour accorder manuellement le rôle d'administrateur à un utilisateur via son email.
 * - **process.exit()** : Termine le processus Node.js de manière synchrone.
 */

// Création d'une connexion dédiée
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lumina_pro'
});

// Connexion à la BDD
db.connect();

// Exécution de l'UPDATE pour changer le rôle en 'admin' pour l'email cible
db.query("UPDATE users SET role='admin' WHERE email='admin@lumina.fr'", (err, r) => {
    if (err) console.error("Error:", err);
    else console.log("Success:", r);
    process.exit(); // Clôture obligatoire pour redonner la main à la console
});


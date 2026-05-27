const mysql = require('mysql2');

/**
 * CONCEPTS EXAMEN :
 * - **Callback nesting (Pyramid of Doom)** : Exemple d'imbrication successive de callbacks. 
 *   Chaque requête SQL attend le retour de la précédente pour s'exécuter.
 * - **SHOW TABLES**, **DESCRIBE table** : Commandes DDL (Data Definition Language)
 *   utiles pour inspecter la structure de la BDD.
 */

// Création d'une connexion dédiée
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lumina_pro'
});

// Établissement de la connexion
db.connect();

// 1. Liste les tables présentes dans la base de données
db.query("SHOW TABLES", (err, tables) => {
    console.log("Tables:", tables);
    
    // 2. Récupère la structure (colonnes, types, index) de la table tasks
    db.query("DESCRIBE tasks", (err, cols) => {
        console.log("Tasks Columns:", cols);
        
        // 3. Récupère tous les enregistrements de la table columns
        db.query("SELECT * FROM columns", (err, rows) => {
            console.log("Columns:", rows);
            process.exit(); // Fermeture du script
        });
    });
});


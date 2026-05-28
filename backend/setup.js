const mysql = require('mysql2');

/**
 * CONNEXION À LA BASE DE DONNÉES
 * NOTE EXAMEN : Nous utilisons ici la version classique (non-promise) du module mysql2.
 * Les callbacks (fonctions de retour) sont passées en paramètre pour traiter le résultat
 * de manière asynchrone traditionnelle.
 */
const dbConfig = require('./config/db');
const db = mysql.createConnection(dbConfig);

// Établissement de la connexion physique
db.connect((err) => {
    if (err) {
        console.error("Erreur de connexion.");
        process.exit(1); // Arrête le script de manière forcée avec un code d'erreur (1)
    }
    console.log("Connecté ! Mise à jour des tables...");

    /**
     * DÉFINITION DU SCHÉMA DE BASE DE DONNÉES (DDL - Data Definition Language)
     * NOTE EXAMEN :
     * - **PRIMARY KEY & AUTO_INCREMENT** : Identifie de manière unique chaque enregistrement et s'incrémente tout seul.
     * - **UNIQUE** : Empêche l'inscription de deux comptes avec la même adresse email (intégrité d'unicité).
     * - **ENUM** : Limite les valeurs autorisées pour un attribut à un ensemble précis (ex: 'admin' ou 'user').
     * - **FOREIGN KEY & ON DELETE CASCADE** : Clé étrangère reliant la tâche à une colonne. L'option CASCADE garantit
     *   que si la colonne parente est supprimée, les tâches enfants associées le sont aussi.
     */
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS columns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(50) NOT NULL,
            position INT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
            deadline DATE,
            id_assigned INT,
            id_col INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_col) REFERENCES columns(id) ON DELETE CASCADE
    ];

    // Exécution de la création de chaque table
    tables.forEach(sql => {
        db.query(sql, (err) => {
            if (err) console.error("Erreur sur :", sql, err);
        });
    });

    /**
     * INITIALISATION DU KANBAN
     * Si la table columns est vide, on ajoute les trois colonnes standard.
     * position 1 = À faire, 2 = En cours, 3 = Terminé.
     */
    db.query("SELECT COUNT(*) as count FROM columns", (err, result) => {
        if (result && result[0].count === 0) {
            db.query("INSERT INTO columns (title, position) VALUES ('À faire', 1), ('En cours', 2), ('Terminé', 3)");
            console.log("Colonnes Kanban (3) créées !");
        }
    });

    console.log("Mise à jour terminée !");
});


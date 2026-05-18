const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lumina_pro'
});

db.connect((err) => {
    if (err) {
        console.error("Erreur de connexion.");
        process.exit(1);
    }
    console.log("Connecté ! Mise à jour des tables...");

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
        )`,
        `CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(50) NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    tables.forEach(sql => {
        db.query(sql, (err) => {
            if (err) console.error("Erreur sur :", sql, err);
        });
    });

    // On ajoute les 3 colonnes par défaut si la table est vide
    db.query("SELECT COUNT(*) as count FROM columns", (err, result) => {
        if (result && result[0].count === 0) {
            db.query("INSERT INTO columns (title, position) VALUES ('À faire', 1), ('En cours', 2), ('Terminé', 3)");
            console.log("Colonnes Kanban (3) créées !");
        }
    });

    console.log("Mise à jour terminée !");
});

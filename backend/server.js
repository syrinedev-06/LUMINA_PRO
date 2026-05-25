const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const verifyToken = require('./middleware/auth'); // Importation de notre middleware de sécurité JWT

// Initialisation de l'application Express
// NOTE EXAMEN : Express est un framework minimaliste pour Node.js permettant de créer des serveurs Web et des API REST.
const app = express();

// Configuration des middlewares globaux
// CORS (Cross-Origin Resource Sharing) : permet au frontend (ex: tournant sur un autre port ou double-cliqué en local)
// de faire des requêtes sécurisées vers notre serveur API.
app.use(cors());

// express.json() : Middleware intégré d'Express qui analyse les corps des requêtes HTTP entrantes au format JSON
// et rend les données accessibles dans 'req.body'.
app.use(express.json());

/**
 * CONFIGURATION DE LA BASE DE DONNÉES
 * NOTE EXAMEN : mysql.createConnection crée un pont de communication avec le serveur MySQL local (souvent XAMPP).
 * Les paramètres définissent l'emplacement, les identifiants d'accès et la base cible.
 */
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lumina_pro'
});

// Établissement de la connexion physique avec MySQL
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion MySQL:', err);
        return;
    }
    console.log('Connecté à la base de données MySQL !');
    
    /**
     * AUTO-RÉPARATION : Création dynamique des tables si elles n'existent pas encore.
     * C'est une bonne pratique de persistance de données (concept d'ORM léger).
     * Clés étrangères : la table tasks possède 'id_col' qui fait référence à la table 'columns'.
     * L'option 'ON DELETE CASCADE' assure que si une colonne est supprimée, toutes ses tâches le sont aussi.
     */
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user'
        )`,
        `CREATE TABLE IF NOT EXISTS columns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            position INT DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
            id_assigned INT,
            id_col INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_col) REFERENCES columns(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_deleted TINYINT(1) DEFAULT 0
        )`
    ];

    // Exécution séquentielle des requêtes de création
    tables.forEach(sql => {
        db.query(sql, (err) => {
            if (err) console.error("Erreur création table:", err.message);
        });
    });

    /**
     * Auto-migration : Ajoute la colonne 'is_deleted' à la table logs si elle manque.
     * Permet la compatibilité avec la fonctionnalité récente de la Corbeille de logs.
     */
    db.query("SHOW COLUMNS FROM logs LIKE 'is_deleted'", (err, results) => {
        if (!err && results.length === 0) {
            db.query("ALTER TABLE logs ADD COLUMN is_deleted TINYINT(1) DEFAULT 0", (err) => {
                if (err) console.error("Erreur alteration table logs:", err.message);
                else console.log("Colonne 'is_deleted' ajoutée à la table 'logs' !");
            });
        }
    });
});

/**
 * Middleware personnalisé pour attacher l'instance de la connexion DB à l'objet 'req'.
 * Grâce à cela, tous nos contrôleurs de routes externes (dans le dossier /routes) 
 * pourront effectuer des requêtes SQL en accédant à `req.db`.
 */
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ==========================================================
// CONFIGURATION DES ROUTES DE L'API (REST API)
// NOTE EXAMEN : Les routes exposent des points d'accès (endpoints) HTTP.
// Nous appliquons le middleware 'verifyToken' pour sécuriser l'accès aux données privées.
// ==========================================================

// Route publique : Authentification (Inscription / Connexion)
// Le routage a été corrigé pour pointer vers './routes/auth' pour utiliser le hachage bcrypt.
app.use('/api/auth', require('./routes/auth'));

// Routes sécurisées (nécessitent un token JWT valide passé dans l'en-tête Authorization)
app.use('/api/users', verifyToken, require('./routes/users'));
app.use('/api/tasks', verifyToken, require('./routes/tasks'));
app.use('/api/columns', verifyToken, require('./routes/columns'));
app.use('/api/logs', verifyToken, require('./routes/logs'));
app.use('/api/stats', verifyToken, require('./routes/stats'));

// Démarrage du serveur web d'écoute
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Le serveur Lumina tourne sur http://localhost:${PORT}`);
});
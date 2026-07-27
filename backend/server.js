require('dotenv').config(); // Charge les variables d'environnement du fichier .env (SECRET_KEY, DB_*, PORT)
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const verifyToken = require('./middleware/security'); // Importation de notre middleware de sécurité JWT
const requireMember = require('./middleware/requireMember'); // Bloque l'accès tant que team_status !== 'member'

// Importation pour la documentation Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
// Initialisation de l'application Express
// NOTE EXAMEN : Express est un framework minimaliste pour Node.js permettant de créer des serveurs Web et des API REST.
const app = express();

// Configuration des middlewares globaux
// CORS (Cross-Origin Resource Sharing) : permet au frontend (ex: tournant sur un autre port ou double-cliqué en local)
// de faire des requêtes sécurisées vers notre serveur API.
app.use(cors());

// Sert les fichiers du frontend via HTTP
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// express.json() : Middleware intégré d'Express qui analyse les corps des requêtes HTTP entrantes au format JSON
// et rend les données accessibles dans 'req.body'.
app.use(express.json());

/**
 * CONFIGURATION DE LA BASE DE DONNÉES
 * NOTE EXAMEN : mysql.createConnection crée un pont de communication avec le serveur MySQL local (souvent XAMPP).
 * Les paramètres définissent l'emplacement, les identifiants d'accès et la base cible.
 */
const dbConfig = require('./config/db');
const db = mysql.createConnection(dbConfig);

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
            role ENUM('admin', 'user') DEFAULT 'user',
            team_status ENUM('pending', 'requested', 'member') DEFAULT 'pending'
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
            due_date DATE DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INT,
            FOREIGN KEY (id_assigned) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (id_col) REFERENCES columns(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    // Exécution séquentielle des requêtes de création
    tables.forEach(sql => {
        db.query(sql, (err) => {
            if (err) console.error("Erreur création table:", err.message);
        });
    });

    // Migration : ajoute due_date sur les bases existantes
    db.query("ALTER TABLE tasks ADD COLUMN due_date DATE DEFAULT NULL", (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("✅ due_date déjà présente en base");
            } else {
                console.error("❌ Migration due_date ÉCHOUÉE:", err.message);
            }
        } else {
            console.log("✅ Colonne due_date ajoutée avec succès !");
        }
    });

    // Migration : ajoute team_status sur les bases existantes.
    // Important : les comptes déjà existants (créés avant cette fonctionnalité) sont automatiquement
    // considérés comme 'member' pour ne rien casser (ils gardent l'accès complet au tableau).
    // Seuls les NOUVEAUX comptes créés après cette migration démarrent à 'pending' (dashboard vide).
    db.query("ALTER TABLE users ADD COLUMN team_status ENUM('pending', 'requested', 'member') DEFAULT 'pending'", (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("✅ team_status déjà présente en base");
            } else {
                console.error("❌ Migration team_status ÉCHOUÉE:", err.message);
            }
        } else {
            db.query("UPDATE users SET team_status = 'member'", (err2) => {
                if (err2) console.error("❌ Passage des comptes existants en 'member' ÉCHOUÉ:", err2.message);
                else console.log("✅ Colonne team_status ajoutée, comptes existants passés en 'member' !");
            });
        }
    });

    // Migration : ajoute created_by sur les bases existantes.
    // Permet à la personne qui a CRÉÉ une tâche de la supprimer même si elle l'a assignée
    // à quelqu'un d'autre (utile en cas d'erreur d'assignation) — voir routes/tasks.js.
    db.query("ALTER TABLE tasks ADD COLUMN created_by INT, ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL", (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("✅ created_by déjà présente en base");
            } else {
                console.error("❌ Migration created_by ÉCHOUÉE:", err.message);
            }
        } else {
            console.log("✅ Colonne created_by ajoutée avec succès !");
        }
    });

    // Initialisation du Kanban : Création des 3 colonnes par défaut si la table est vide
    db.query("SELECT COUNT(*) as count FROM columns", (err, result) => {
        if (!err && result && result[0].count === 0) {
            db.query("INSERT INTO columns (title, position) VALUES ('À faire', 1), ('En cours', 2), ('Terminé', 3)");
            console.log("Colonnes par défaut créées !");
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

// Route de Documentation de l'API (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route publique : Authentification (Inscription / Connexion)
// Le routage a été corrigé pour pointer vers './routes/auth' pour utiliser le hachage bcrypt.
app.use('/api/auth', require('./routes/auth'));

// Routes sécurisées (nécessitent un token JWT valide passé dans l'en-tête Authorization)
app.use('/api/users', verifyToken, require('./routes/users'));
app.use('/api/tasks', verifyToken, requireMember, require('./routes/tasks'));
app.use('/api/columns', verifyToken, requireMember, require('./routes/columns'));
app.use('/api/team', verifyToken, require('./routes/team'));
app.use('/api/logs', verifyToken, require('./routes/logs'));

// Démarrage du serveur web d'écoute
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Le serveur Lumina tourne sur http://localhost:${PORT}`);
});
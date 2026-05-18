const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURATION DE LA BASE DE DONNÉES
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lumina_pro'
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion MySQL:', err);
        return;
    }
    console.log('Connecté à la base de données MySQL !');
    
    // AUTO-RÉPARATION : Création des tables si elles manquent
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
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    tables.forEach(sql => {
        db.query(sql, (err) => {
            if (err) console.error("Erreur création table:", err.message);
        });
    });
});

// Middleware pour passer la DB aux routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ROUTES
app.use('/api/users', require('./routes/users')); // Corrigé ici
app.use('/api/auth', require('./routes/users'));  // Pour la connexion
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/columns', require('./routes/columns'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/stats', require('./routes/stats'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Le serveur Lumina tourne sur http://localhost:${PORT}`);
});
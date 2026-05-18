-- On commence par créer la base de données si elle n'existe pas déjà
CREATE DATABASE IF NOT EXISTS lumina_pro;

-- On dit au système d'utiliser cette base pour les commandes qui suivent
USE lumina_pro;

-- ==========================================================
-- 1. TABLE DES UTILISATEURS (users)
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
    -- 'id' est l'identifiant unique de chaque personne (clé primaire)
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- 'name' stocke le nom complet de l'utilisateur
    name VARCHAR(100) NOT NULL,
    -- 'email' est unique : on ne peut pas avoir deux comptes avec le même email
    email VARCHAR(100) NOT NULL UNIQUE,
    -- 'password' stocke le mot de passe (il sera crypté pour la sécurité)
    password VARCHAR(255) NOT NULL,
    -- 'role' définit si la personne est 'admin' ou 'user'
    role ENUM('admin', 'user') DEFAULT 'user',
    -- 'avatar' stocke le nom de l'image de profil
    avatar VARCHAR(255) DEFAULT 'default.png',
    -- 'created_at' enregistre automatiquement la date de création du compte
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- 2. TABLE DES COLONNES DU KANBAN (columns)
-- ==========================================================
CREATE TABLE IF NOT EXISTS columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- 'title' est le nom de la colonne (ex: "À faire", "Terminé")
    title VARCHAR(50) NOT NULL,
    -- 'position' permet de trier l'ordre des colonnes (1, 2, 3...)
    position INT NOT NULL
);

-- ==========================================================
-- 3. TABLE DES TÂCHES (tasks)
-- ==========================================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- 'title' est le nom de la mission
    title VARCHAR(255) NOT NULL,
    -- 'description' contient les détails du travail à faire
    description TEXT,
    -- 'priority' définit l'urgence (haute, moyenne, basse)
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    -- 'deadline' est la date limite de la tâche
    deadline DATE,
    -- 'progress' est un pourcentage d'avancement (0 à 100)
    progress INT DEFAULT 0,
    -- 'id_assigned' fait le lien avec l'utilisateur qui doit faire la tâche (Clé Étrangère)
    id_assigned INT,
    -- 'id_col' fait le lien avec la colonne où se trouve la tâche (Clé Étrangère)
    id_col INT,
    -- Date de création
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- On crée des "Foreign Keys" (Clés Étrangères) pour lier les tables entre elles
    FOREIGN KEY (id_assigned) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (id_col) REFERENCES columns(id) ON DELETE CASCADE
);

-- ==========================================================
-- 4. TABLE DES NOTIFICATIONS
-- ==========================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    -- 'message' est le texte de l'alerte
    message TEXT NOT NULL,
    -- 'is_read' permet de savoir si l'utilisateur a vu l'alerte
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================================
-- 5. TABLE DES LOGS (HISTORIQUE)
-- ==========================================================
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    -- 'action' décrit ce qui a été fait (ex: "A déplacé une tâche")
    action VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================================
-- INSERTION DES DONNÉES PAR DÉFAUT
-- ==========================================================
-- On crée les 4 colonnes de base obligatoires
INSERT INTO columns (title, position) VALUES 
('To Do', 1),
('In Progress', 2),
('Review', 3),
('Done', 4);

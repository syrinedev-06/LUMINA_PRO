-- On commence par créer la base de données si elle n'existe pas déjà
CREATE DATABASE IF NOT EXISTS lumina_pro;

-- On dit au système d'utiliser cette base pour les commandes qui suivent
USE lumina_pro;

-- ==========================================================
-- Ce script reflète EXACTEMENT les 3 tables créées automatiquement
-- par backend/server.js au démarrage (mêmes noms de colonnes, mêmes
-- contraintes). Il sert de référence lisible pour la BDD, sans rien
-- ajouter que le code ne crée pas réellement.
-- ==========================================================

-- ==========================================================
-- 1. TABLE DES UTILISATEURS (users)
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
    -- 'id' est l'identifiant unique de chaque personne (clé primaire)
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- 'name' stocke le nom complet de l'utilisateur
    name VARCHAR(255) NOT NULL,
    -- 'email' est unique : on ne peut pas avoir deux comptes avec le même email
    email VARCHAR(255) NOT NULL UNIQUE,
    -- 'password' stocke le mot de passe (haché avec bcrypt avant insertion)
    password VARCHAR(255) NOT NULL,
    -- 'role' définit si la personne est 'admin' ou 'user'
    role ENUM('admin', 'user') DEFAULT 'user'
);

-- ==========================================================
-- 2. TABLE DES COLONNES DU KANBAN (columns)
-- ==========================================================
CREATE TABLE IF NOT EXISTS columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- 'title' est le nom de la colonne (ex: "À faire", "Terminé")
    title VARCHAR(255) NOT NULL,
    -- 'position' permet de trier l'ordre des colonnes (1, 2, 3...)
    position INT DEFAULT 0
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
-- INSERTION DES DONNÉES PAR DÉFAUT
-- ==========================================================
-- server.js crée automatiquement 3 colonnes si la table est vide au démarrage
INSERT INTO columns (title, position) VALUES
('À faire', 1),
('En cours', 2),
('Terminé', 3);

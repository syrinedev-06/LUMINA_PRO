// 1. Importation du module de connexion mysql2 dans sa version "Promise"
// NOTE EXAMEN : La version 'promise' permet d'utiliser 'async/await', évitant les retours d'appel imbriqués ("callback hell").
const mysql = require('mysql2/promise');

// Importation de la bibliothèque bcrypt pour le hachage sécurisé des mots de passe.
const bcrypt = require('bcrypt');

/**
 * @brief Fonction principale asynchrone qui réinitialise et peuple la base de données (Seeder).
 * 
 * CONCEPTS CLÉS POUR L'EXAMEN :
 * - **Seeder** : Script servant à alimenter une base de données avec un jeu de données initial (ou de test).
 * - **Transaction & Try/Catch/Finally** : Garantit que s'il y a un plantage SQL, la connexion BDD est toujours fermée correctement.
 * - **Hachage vs Chiffrement** : Le hachage avec Bcrypt est unidirectionnel. On ne peut pas "déchiffrer" un mot de passe haché ; 
 *   on peut seulement comparer le hachage d'une tentative avec celui stocké en BDD (via bcrypt.compare).
 * - **Clés étrangères (FOREIGN_KEY_CHECKS)** : MySQL empêche le vidage d'une table liée à une autre par une relation d'intégrité. 
 *   On doit temporairement désactiver cette vérification avant d'effectuer les TRUNCATE.
 * 
 * @returns {Promise<void>} Renvoie une promesse résolue une fois l'injection de données terminée.
 */
async function runSeeder() {
    // Établissement de la connexion en mode Promise
    const dbConfig = require('./config/db');
    const connection = await mysql.createConnection(dbConfig);

    console.log("🌱 Début du peuplement de la base de données...");

    try {
        // 1. Désactivation temporaire des contraintes d'intégrité référentielle
        // NOTE EXAMEN : Nécessaire pour pouvoir vider les tables (TRUNCATE) sans erreur de clé étrangère.
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        // 2. Nettoyage complet des anciennes données
        // TRUNCATE vide la table et réinitialise les compteurs AUTO_INCREMENT à 1.
        await connection.query('TRUNCATE TABLE tasks;');
        await connection.query('TRUNCATE TABLE users;');

        // 3. Réactivation immédiate des contraintes pour préserver l'intégrité de la BDD
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

        // 4. Hachage sécurisé du nouveau mot de passe fort 'Lumina1!'
        // Il contient une majuscule, une minuscule, un chiffre et un caractère spécial.
        const hashedTestPassword = await bcrypt.hash('Lumina1!', 10);

        // 5. Insertion des utilisateurs de test avec le mot de passe haché
        // NOTE EXAMEN : Les requêtes d'insertion (INSERT INTO) enregistrent les nouveaux membres.
        // Inès Admin aura le rôle 'admin', Collaborateur 1 aura le rôle 'user' (défini par défaut par la table).
        const [userResult] = await connection.query(`
            INSERT INTO users (name, email, password, role) VALUES 
            ('Inès Admin', 'admin@lumina.com', ?, 'admin'),
            ('Collaborateur 1', 'user@lumina.com', ?, 'user');
        `, [hashedTestPassword, hashedTestPassword]);

        console.log("✅ Utilisateurs insérés !");

        // 6. Récupération des identifiants générés en base pour lier correctement les tâches
        // Nous allons lier la première tâche à l'administrateur (id_assigned = 1 ou le premier ID inséré)
        // et la troisième tâche au collaborateur.
        const [insertedUsers] = await connection.query("SELECT id FROM users ORDER BY id ASC");
        const adminId = insertedUsers[0].id;
        const userId = insertedUsers[1].id;

        // 7. Insertion du jeu de données des tâches initiales (Kanban)
        // id_col 1 = "À faire", 2 = "En cours", 3 = "Terminé" (créées dans setup.js)
        await connection.query(`
            INSERT INTO tasks (title, description, id_col, priority, id_assigned) VALUES 
            ('Finaliser le design', 'Reprendre le modèle Vintanzo de Dribbble', 1, 'high', ?),
            ('Finir le MCD', 'Vérifier les clés étrangères', 2, 'medium', ?),
            ('Trello de test', 'Vérifier le drag and drop', 3, 'low', ?);
        `, [adminId, adminId, userId]);

        console.log("✅ Tâches initiales insérées !");
        console.log("✨ Base de données prête et remplie avec succès !");

    } catch (error) {
        console.error("❌ Erreur pendant le seeding :", error);
    } finally {
        // Clause finally : s'exécute TOUJOURS, même si une erreur survient dans le try.
        // Indispensable pour fermer la connexion et libérer les ressources réseau/mémoire du serveur MySQL.
        await connection.end();
    }
}

// Appel immédiat de la fonction pour démarrer le script de seeding
runSeeder();
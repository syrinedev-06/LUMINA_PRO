// 1. On importe le module de connexion mysql2 dans sa version "Promise" pour pouvoir écrire un code moderne avec "async/await"
const mysql = require('mysql2/promise');

// 2. On déclare une fonction asynchrone principale qui va contenir toute notre logique de nettoyage et d'injection de données
async function runSeeder() {

    // 3. On crée et on attend (await) l'ouverture d'une connexion SQL directe avec les paramètres du serveur local (XAMPP / WAMP)
    const connection = await mysql.createConnection({
        host: 'localhost',     // Le serveur de base de données tourne sur la machine locale
        user: 'root',          // L'identifiant administrateur universel par défaut de XAMPP
        password: '',          // Le mot de passe par défaut sur XAMPP (qui est une chaîne de caractères vide)
        database: 'lumina_pro' // Le nom exact de la base de données que l'on souhaite réinitialiser et remplir
    });

    // 4. On affiche un message d'information dans le terminal pour valider visuellement que le script s'est bien lancé
    console.log("🌱 Début du peuplement de la base de données...");

    // 5. On met en place une structure de sécurité "try/catch" : le bloc "try" va tenter d'exécuter l'ensemble de nos requêtes SQL
    try {

        // 6. On désactive temporairement la vérification des clés étrangères pour que MySQL nous laisse manipuler les tables librement
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        // 7. Opération CRUD (Delete) : On vide entièrement la table "tasks" et on remet son compteur d'identifiant à zéro
        await connection.query('TRUNCATE TABLE tasks;');

        // 8. Opération CRUD (Delete) : On vide entièrement la table "users" pour nettoyer les anciens comptes de test
        await connection.query('TRUNCATE TABLE users;');

        // 9. Sécurité : On réactive immédiatement la vérification des clés étrangères pour préserver l'intégrité de la base de données
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

        // 10. Opération CRUD (Create) : On insère notre jeu de données de test pour les utilisateurs (un compte administrateur et un utilisateur standard)
        // Les crochets [userResult] permettent d'isoler et de récupérer la réponse brute contenant les données insérées renvoyée par le serveur SQL
        const [userResult] = await connection.query(`
            INSERT INTO users (name, email, password, role) VALUES 
            ('Inès Admin', 'admin@lumina.com', '123456', 'admin'),
            ('Collaborateur 1', 'user@lumina.com', '123456', 'utilisateur');
        `);

        // 11. On envoie un message de succès dans la console pour valider que la création des comptes utilisateurs s'est bien passée
        console.log("✅ Utilisateurs insérés !");

        // 12. Opération CRUD (Create) : On injecte en base de données les 3 premières missions de test qui viendront alimenter le Kanban automatiquement
        // "id_col: 1" correspond à la colonne À Faire, "2" à En Cours, et "3" à Terminé. Les "id_assigned" lient les tâches aux IDs des utilisateurs
        await connection.query(`
            INSERT INTO tasks (title, description, id_col, priority, id_assigned) VALUES 
            ('Finaliser le design', 'Reprendre le modèle Vintanzo de Dribbble', 1, 'urgent', 1),
            ('Finir le MCD', 'Vérifier les clés étrangères', 2, 'important', 1),
            ('Trello de test', 'Vérifier le drag and drop', 3, 'normal', 2);
        `);

        // 13. On confirme dans la console que les tâches ont bien été enregistrées en base de données
        console.log("✅ Tâches initiales insérées !");

        // 14. Message final de réussite indiquant au développeur que l'environnement de test est prêt
        console.log("✨ Base de données prête et remplie avec succès !");

    } catch (error) {

        // 15. Si une erreur (bug de syntaxe SQL ou problème réseau) survient dans le bloc "try", le script s'arrête et l'affiche ici
        console.error("❌ Erreur pendant le seeding :", error);

    } finally {

        // 16. Quoi qu'il soit arrivé (succès ou échec), on ferme impérativement la connexion avec MySQL pour libérer la mémoire du serveur
        await connection.end();

    }
}

// 17. On appelle la fonction principale "runSeeder" pour exécuter tout le script dès que l'on tape la commande "node seed.js" dans le terminal
runSeeder();
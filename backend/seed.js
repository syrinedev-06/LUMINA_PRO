// 1. On importe le module de connexion mysql2 dans sa version "Promise" pour pouvoir écrire un code moderne avec "async/await"
const mysql = require('mysql2/promise');
// bcrypt est nécessaire pour hacher les mots de passe de test de la même façon que routes/auth.js,
// sinon bcrypt.compare() lors du login échoue face à un mot de passe stocké en clair.
const bcrypt = require('bcrypt');

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
        // Les mots de passe doivent être hachés avec bcrypt (mêmes règles que routes/auth.js), sinon
        // bcrypt.compare() échouera systématiquement lors de la connexion avec ces comptes de test.
        // Mot de passe en clair pour les deux comptes de démonstration : Lumina1! (voir README.md)
        const hashedPassword = await bcrypt.hash('Lumina1!', 10);

        await connection.query(`
            INSERT INTO users (name, email, password, role) VALUES
            ('Inès Admin', 'admin@lumina.com', ?, 'admin'),
            ('Collaborateur 1', 'user@lumina.com', ?, 'user');
        `, [hashedPassword, hashedPassword]);

        // 11. On envoie un message de succès dans la console pour valider que la création des comptes utilisateurs s'est bien passée
        console.log("✅ Utilisateurs insérés !");

        // 12. Opération CRUD (Create) : On injecte en base de données les 3 premières missions de test qui viendront alimenter le Kanban automatiquement
        // "id_col: 1" correspond à la colonne À Faire, "2" à En Cours, et "3" à Terminé. Les "id_assigned" lient les tâches aux IDs des utilisateurs
        // La colonne "priority" est un ENUM('high', 'medium', 'low') en base (voir server.js / schema.sql) :
        // toute autre valeur ('urgent', 'important', 'normal'...) est rejetée par MySQL.
        await connection.query(`
            INSERT INTO tasks (title, description, id_col, priority, id_assigned) VALUES
            ('Finaliser le design', 'Reprendre le modèle Vintanzo de Dribbble', 1, 'high', 1),
            ('Finir le MCD', 'Vérifier les clés étrangères', 2, 'medium', 1),
            ('Trello de test', 'Vérifier le drag and drop', 3, 'low', 2);
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
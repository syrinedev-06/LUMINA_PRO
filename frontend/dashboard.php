<?php 
/**
 * =========================================================================
 * LUMINA PRO - CODE EXEMPLE PHP (RENDU SERVEUR)
 * =========================================================================
 * Fichier : dashboard.php
 * Rôle : Affiche les tâches en utilisant le langage PHP classique,
 *        directement depuis le serveur vers le navigateur.
 * 
 * --- POUR L'EXAMEN (VERSION FACILE À LIRE) ---
 */

// 1. INCLURE LA CONNEXION À LA BASE DE DONNÉES
/**
 * Explication simple pour l'examen :
 * - require_once vs include : 
 *   - `require` veut dire "obligatoire". Si le fichier config.php est introuvable (par exemple si le chemin 
 *     est faux), PHP s'arrête net avec une grosse erreur. C'est normal, car sans base de données, 
 *     le site ne peut pas fonctionner !
 *   - `include`, lui, afficherait juste un avertissement mais continuerait à lire la suite de la page.
 *   - `_once` veut dire "une seule fois". Cela évite d'ouvrir la connexion deux fois par erreur.
 */
require_once 'back/config.php'; 

// 2. ALLER CHERCHER LES DONNÉES EN BDD AVEC PDO
/**
 * Explication simple pour l'examen :
 * - PDO (PHP Data Objects) : C'est comme un traducteur universel pour bases de données. 
 *   Que l'on utilise MySQL, SQLite ou PostgreSQL, PDO permet d'écrire le même code PHP.
 * - query() : On l'utilise ici pour envoyer notre commande SQL brute "SELECT * FROM tasks" 
 *   car il n'y a aucune donnée écrite par un utilisateur à l'intérieur.
 *   Si un utilisateur pouvait taper du texte qui va directement dans la commande SQL, 
 *   il faudrait obligatoirement utiliser un "prepare()" (requête préparée) pour éviter 
 *   que le pirate ne casse notre base de données (c'est la faille "Injection SQL").
 * - FETCH_ASSOC : Transforme la réponse de la base de données en une liste de lignes faciles à lire 
 *   par PHP (ex: $t['title'] pour avoir le titre de la tâche).
 */
$resultat = $pdo->query("SELECT * FROM tasks");
$taches = $resultat->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Lumina Pro - Démo PHP</title>
    <link rel="stylesheet" href="style.css"> 
</head>
<body>
    <h1>Tableau de bord Lumina (PHP Traditionnel)</h1>

    <div class="board">
        <!-- BOUCLE POUR AFFICHER CHAQUE TÂCHE DE LA BASE DE DONNÉES -->
        /**
         * Explication simple pour l'examen :
         * - foreach (...) / endforeach : C'est une boucle qui parcourt notre liste de tâches 
         *   et répète le code HTML pour chaque tâche trouvée.
         * - Faille XSS (Sécurité) et htmlspecialchars() :
         *   - Danger : Si un utilisateur malveillant a enregistré une tâche ayant pour titre 
         *     "<script>alert('piraté')</script>", le navigateur va lancer le script. C'est la faille XSS.
         *   - Solution : On utilise TOUJOURS `htmlspecialchars()` pour transformer les caractères 
         *     comme `<` et `>` en texte inoffensif. Le script ne se lancera pas, il s'affichera juste 
         *     comme du texte simple.
         */
        <?php foreach ($taches as $t): ?>
            <div class="task-card">
                <!-- On protège le titre contre la faille XSS avec htmlspecialchars -->
                <h4><?php echo htmlspecialchars($t['title'], ENT_QUOTES, 'UTF-8'); ?></h4>
                
                <span class="js-date-echeance" style="display:none;"><?php echo htmlspecialchars($t['due_date'], ENT_QUOTES, 'UTF-8'); ?></span>
                
                <p class="js-resultat-calcul"></p>
            </div>
        <?php endforeach; ?>
    </div>

    <script src="script.js"></script> 
</body>
</html>
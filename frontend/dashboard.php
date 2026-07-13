<?php 
// 1. On appelle la porte ouverte (config.php)
require_once 'back/config.php'; 

// 2. On récupère les tâches dans la base de données
$resultat = $pdo->query("SELECT * FROM tasks");
$taches = $resultat->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Lumina Pro</title>
    <link rel="stylesheet" href="style.css"> </head>
<body>
    <h1>Tableau de bord Lumina</h1>

    <div class="board">
        <?php foreach ($taches as $t): ?>
            <div class="task-card">
                <h4><?php echo $t['title']; ?></h4>
                
                <span class="js-date-echeance" style="display:none;"><?php echo $t['due_date']; ?></span>
                
                <p class="js-resultat-calcul"></p>
            </div>
        <?php endforeach; ?>
    </div>

    <script src="script.js"></script> </body>
</html>
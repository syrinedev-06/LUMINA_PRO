<?php
/**
 * FICHIER DE CONFIGURATION PHP (config.php)
 * 
 * CONCEPT EXAMEN (Accès aux données en PHP) :
 * - **PDO (PHP Data Objects)** : Extension PHP définissant une interface pour accéder à une base de données.
 *   Elle est orientée objet et offre une couche d'abstraction (on peut changer de SGBD comme PostgreSQL/Oracle 
 *   sans réécrire toutes les requêtes SQL, juste en modifiant le DSN).
 * - **DSN (Data Source Name)** : Chaîne définissant le pilote, l'hôte, le nom de la base et l'encodage (charset=utf8).
 * - **Gestion des erreurs (Exception)** : Le bloc `try/catch` capture tout échec de connexion (ex: serveur MySQL arrêté) 
 *   et empêche PHP d'afficher les identifiants d'accès dans un message d'erreur public (faille de sécurité).
 * - **die() ou exit()** : Arrête immédiatement l'exécution du script en cas d'erreur bloquante.
 */

// Paramètres de connexion au serveur local (MySQL / MariaDB via XAMPP)
$host = "localhost";
$db   = "lumina_pro";
$user = "root";
$pass = "";

try {
    // Instanciation de l'objet PDO pour établir la connexion avec le DSN approprié
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    
    // Configuration de PDO pour lever des exceptions en cas d'erreur SQL
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    // En cas d'erreur de connexion, le script s'arrête proprement et affiche le message d'erreur
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}
?>
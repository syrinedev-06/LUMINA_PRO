<?php
// On définit les paramètres de connexion
$host = "localhost";
$db   = "lumina_pro";
$user = "root";
$pass = "";

try {
    // Connexion à la base de données avec PDO
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
} catch (Exception $e) {
    // Si la connexion échoue, on affiche l'erreur
    die("Erreur de connexion : " . $e->getMessage());
}
?>
# Lumina Pro 🌸

Lumina Pro est un outil moderne et collaboratif de gestion de tâches (Kanban) intégrant un suivi d'activité (historique) et une gestion des utilisateurs.

## 🛠️ Architecture du projet

Le projet est divisé en deux parties :
- **`/backend`** : Serveur API construit en Node.js avec Express, se connectant à une base de données MySQL.
- **`/frontend`** : Interface utilisateur réactive en HTML5, CSS3 vanille et JavaScript (sans frameworks lourds).

---

## 🚀 Installation et Démarrage

### 1. Base de données
Assurez-vous que votre serveur MySQL (via XAMPP par exemple) est démarré.
- Créez une base de données nommée `lumina_pro`.
- Les tables nécessaires (`users`, `columns`, `tasks`, `logs`) seront créées automatiquement par le backend lors de son premier démarrage.

### 2. Démarrer le Backend
Accédez au dossier backend et installez les dépendances, puis démarrez le serveur :
```bash
cd backend
npm install
npm start
```
Le serveur tournera sur `http://localhost:3000`.

### 3. Ouvrir le Frontend
Ouvrez simplement le fichier **`frontend/index.html`** dans votre navigateur internet (ou servez-le via une extension Live Server).

---

## 💎 Fonctionnalités et Personnalisation Récentes

- **Identité Visuelle Rose Fuchsia** : Style moderne avec la couleur fuchsia `#e536b7` au survol et lors des clics sur la barre latérale.
- **Logo personnalisé** : Intégration du logo `logo.png` en grand dans la barre latérale sur fond blanc.
- **Bouton profil interactif** : Clic direct sur l'avatar pour modifier ses informations.
- **Boutons uniformes** : Uniformisation de la taille et de l'apparence des boutons de validation, d'annulation et de suppression dans les fenêtres modales.
- **Pagination de l'historique** : Affichage propre de 10 événements par page pour l'historique d'activité.
- **Suppression d'historique (Admin)** : Les administrateurs peuvent cocher les logs de leur choix pour les supprimer de la base de données.

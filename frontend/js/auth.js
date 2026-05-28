/**
 * =========================================================================
 * LUMINA PRO - CONNEXION & INSCRIPTION (FRONTEND)
 * =========================================================================
 * Fichier : js/auth.js
 * Rôle : Gère le fait de se connecter (Login) ou de créer un compte (Register)
 *        sur l'interface, et stocke notre ticket d'accès (JWT) dans l'ordinateur.
 * 
 * --- POUR L'EXAMEN (VERSION TRÈS SIMPLE) ---
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    


    /**
     * S'INSCRIRE (CRÉER UN COMPTE)
     * 
     * Explication simple pour l'examen :
     * 1. e.preventDefault() : Empêche la page de se rafraîchir entièrement. On veut envoyer 
     *    les informations en secret par derrière.
     * 2. fetch (POST) : Envoie une "lettre" (une requête HTTP) au serveur pour lui dire :
     *    "Crée-moi un utilisateur avec ce nom, cet email et ce mot de passe".
     * 3. Sécurité (Bcrypt côté serveur) : Le mot de passe que l'on écrit va être transformé 
     *    en bouillie illisible (hachage) par le serveur avant d'être enregistré dans la base 
     *    de données. Comme ça, même si un pirate vole la base de données, il ne peut pas 
     *    lire nos mots de passe.
     */
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault(); 

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();
                
                if (response.ok) {
                    
                    alert("Compte créé ! Vous pouvez vous connecter.");
                    window.location.reload(); // Recharge la page pour afficher la connexion
                } else {
                    alert(data.error || "Impossible de créer le compte.");
                }
            } catch (error) {
                console.error(error);
                alert("Erreur de connexion avec le serveur.");
            }
        };
    }

    /**
     * SE CONNECTER (LOGIN)
     * 
     * Explication simple pour l'examen :
     * 1. Qu'est-ce que le JWT (le ticket de connexion) ?
     *    Le serveur vérifie notre e-mail et notre mot de passe. Si c'est correct, il nous renvoie 
     *    un jeton (Token) JWT. C'est une longue ligne de lettres et chiffres qui sert de ticket de connexion.
     * 2. LocalStorage :
     *    C'est un petit tiroir secret dans notre navigateur web. On y range notre ticket JWT. 
     *    Tant qu'il est dans le tiroir, on reste connecté (même si on ferme et rouvre le navigateur).
     * 3. Danger XSS (Sécurité) :
     *    Le LocalStorage est facile d'accès en JavaScript. Si un pirate réussit à injecter du code 
     *    bizarre sur notre site, il peut voler notre ticket. Une autre méthode plus sûre consiste à utiliser 
     *    des "Cookies HttpOnly", que le JavaScript ne peut pas lire.
     */
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault(); 

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // On enregistre le ticket JWT et les informations de l'utilisateur
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user)); 

                    // On va sur le tableau de bord
                    window.location.href = 'index.html';
                } else {
                    alert(data.error || "Email ou mot de passe incorrect.");
                }
            } catch (error) {
                console.error(error);
                alert("Impossible de joindre le serveur API. Est-il lancé ?");
            }
        };
    }
});

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
     * AUTO-REMPLISSAGE (SE SOUVENIR DU COMPTE)
     * 
     * Explication simple pour l'examen :
     * 1. setTimeout : Permet d'attendre un court instant (ici 0,3 seconde) avant de remplir
     *    les cases e-mail et mot de passe enregistrées. Cela donne le temps au navigateur 
     *    de finir de s'afficher.
     * 2. dispatchEvent : C'est comme si on cliquait et écrivait nous-mêmes avec notre clavier. 
     *    Cela réveille le navigateur pour qu'il prenne bien en compte l'adresse e-mail 
     *    et le mot de passe automatique.
     */
    if (loginForm) {
        setTimeout(() => {
            // On récupère l'e-mail et le mot de passe gardés en mémoire dans le navigateur
            const savedEmail = localStorage.getItem('saved_email');
            const savedPassword = localStorage.getItem('saved_password');
            
            if (savedEmail && savedPassword) {
                const emailInput = document.getElementById('login-email');
                const passwordInput = document.getElementById('login-password');
                
                if (emailInput && passwordInput) {
                    emailInput.value = savedEmail;
                    passwordInput.value = savedPassword;
                    
                    // On simule une écriture pour valider les cases
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, 300); 
    }

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
                    // On garde les identifiants en mémoire pour la page de connexion
                    localStorage.setItem('saved_email', email);
                    localStorage.setItem('saved_password', password);
                    
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
                    // On enregistre l'email et le mot de passe
                    localStorage.setItem('saved_email', email);
                    localStorage.setItem('saved_password', password);

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

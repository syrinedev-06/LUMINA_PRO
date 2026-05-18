document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Auto-remplissage manuel via localStorage avec un léger délai et dispatch d'événements
    if (loginForm) {
        setTimeout(() => {
            const savedEmail = localStorage.getItem('saved_email');
            const savedPassword = localStorage.getItem('saved_password');
            if (savedEmail && savedPassword) {
                const emailInput = document.getElementById('login-email');
                const passwordInput = document.getElementById('login-password');
                if (emailInput && passwordInput) {
                    emailInput.value = savedEmail;
                    passwordInput.value = savedPassword;
                    
                    // Déclencher les événements pour forcer le navigateur à enregistrer la valeur
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, 300); // 300ms pour être sûr de passer après tous les cycles du navigateur
    }

    // 1. INSCRIPTION
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                // Sauvegarder aussi les infos à la création pour préremplir direct au retour !
                localStorage.setItem('saved_email', email);
                localStorage.setItem('saved_password', password);
                alert("Compte créé ! Vous pouvez vous connecter.");
                window.location.reload(); // On rafraîchit pour revenir au login
            } else {
                alert(data.error);
            }
        };
    }

    // 2. CONNEXION
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
                    // Sauvegarde des identifiants dans le localStorage pour l'auto-remplissage garanti
                    localStorage.setItem('saved_email', email);
                    localStorage.setItem('saved_password', password);

                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'index.html';
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert("Erreur : Impossible de contacter le serveur. Vérifiez qu'il est bien lancé.");
            }
        };
    }
});

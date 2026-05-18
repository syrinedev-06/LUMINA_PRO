const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('register-form');

// Bascule UI
if(document.getElementById('link-to-register')) {
    document.getElementById('link-to-register').onclick = () => {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('register-container').style.display = 'block';
    };
}

// Connexion
if(loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-pass').value
            })
        });
        const data = await res.json();
        if(res.ok) {
            localStorage.setItem('user', JSON.stringify(data));
            if(document.getElementById('remember-me').checked) {
                localStorage.setItem('rememberedEmail', document.getElementById('login-email').value);
            }
            window.location.href = 'index.html';
        } else { alert(data.error); }
    };
}

// Inscription
if(regForm) {
    regForm.onsubmit = async (e) => {
        e.preventDefault();
        const pass = document.getElementById('reg-pass').value;
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        if(!regex.test(pass)) return alert("Le mot de passe doit être plus fort (8+ carac, Maj, Min, Chiffre, Spécial).");

        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: pass
            })
        });
        if(res.ok) { alert("Compte créé !"); location.reload(); }
    };
}

window.onload = () => {
    const saved = localStorage.getItem('rememberedEmail');
    if(saved && document.getElementById('login-email')) document.getElementById('login-email').value = saved;
};
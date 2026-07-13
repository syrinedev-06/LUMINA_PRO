const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lumina_pro'
});

db.connect();

db.query("UPDATE users SET role='admin' WHERE email='admin@lumina.fr'", (err, r) => {
    if (err) console.error("Error:", err);
    else console.log("Success:", r);
    process.exit();
});

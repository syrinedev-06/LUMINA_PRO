const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lumina_pro'
});

db.connect();

db.query("SHOW TABLES", (err, tables) => {
    console.log("Tables:", tables);
    db.query("DESCRIBE tasks", (err, cols) => {
        console.log("Tasks Columns:", cols);
        db.query("SELECT * FROM columns", (err, rows) => {
            console.log("Columns:", rows);
            process.exit();
        });
    });
});

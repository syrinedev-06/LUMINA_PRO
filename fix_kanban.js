const fs = require('fs');
let js = fs.readFileSync('frontend/js/kanban.js', 'utf8');

// The file currently has a duplicate of the entire dashboard.js starting around line 200.
// Let's just find the original full code inside it.
let fullCodeIndex = js.indexOf('LUMINA PRO - TABLEAU DE BORD (KANBAN)');
let original = js.substring(fullCodeIndex - 100);

// Now we remove the unwanted sections from the original string.
// We'll use regex to match from the section header to the next section header.

let cleanJs = original;

// Remove Stats (Section 3 to Section 4)
cleanJs = cleanJs.replace(/\/\/ =+\s*\/\/\s*3\. LES STATISTIQUES[\s\S]*?(?=\/\/ =+\s*\/\/\s*4\. L'ÉQUIPE)/, '');

// Remove Team (Section 4 to Section 5)
cleanJs = cleanJs.replace(/\/\/ =+\s*\/\/\s*4\. L'ÉQUIPE[\s\S]*?(?=\/\/ =+\s*\/\/\s*5\. LE PROFIL)/, '');

// Remove Profile (Section 5 to Section 6)
cleanJs = cleanJs.replace(/\/\/ =+\s*\/\/\s*5\. LE PROFIL[\s\S]*?(?=\/\/ =+\s*\/\/\s*6\. L'HISTORIQUE)/, '');

// Remove History (Section 6 to Section 7)
cleanJs = cleanJs.replace(/\/\/ =+\s*\/\/\s*6\. L'HISTORIQUE[\s\S]*?(?=\/\/ =+\s*\/\/\s*7\. GESTION)/, '');

// Remove API/AuthFetch since it's in api.js now (Section 0 to Section 1)
cleanJs = cleanJs.replace(/\/\/ =+\s*\/\/\s*0\. SÉCURITÉ[\s\S]*?(?=\/\/ =+\s*\/\/\s*1\. DÉMARRAGE)/, '');

fs.writeFileSync('frontend/js/kanban.js', cleanJs);
console.log('kanban.js cleaned up!');

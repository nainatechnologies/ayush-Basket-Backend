const fs = require('fs');
let code = fs.readFileSync('src/controllers/revenueController.js', 'utf8');
code = code.replace(let whereClauses = ['status = "completed"'];, let whereClauses = ['status NOT IN ("cancelled", "rejected")'];);
fs.writeFileSync('src/controllers/revenueController.js', code);
console.log('Fixed revenueController.js');

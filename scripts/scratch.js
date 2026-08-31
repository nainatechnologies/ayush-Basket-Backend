const fs = require('fs');
const path = require('path');
const p = 'c:/ayushbasket/ayushbasket-bakend/controllers/orderController.js';
let code = fs.readFileSync(p, 'utf8');
const replacement = fs.readFileSync('replacement.txt', 'utf8');
code = code.replace(/const getOrders = async \([\s\S]*?res\.status\(500\)\.json\([\s\S]*?\}\n\};\n/, replacement + '\n\n');
fs.writeFileSync(p, code);
console.log('done orderController');

/**
 * AyushBasket Backend – First-Time Setup Script
 * Run: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

console.log('\n🚀  AyushBasket Backend Setup\n');

// 1. Check Node version
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`❌  Node.js ${process.versions.node} is too old. Please install Node.js 18 or newer.`);
  console.error('   Download: https://nodejs.org/\n');
  process.exit(1);
}
console.log(`✅  Node.js ${process.versions.node} — OK`);

// 2. Check .env file
const envPath = path.join(ROOT, '.env');
const envExamplePath = path.join(ROOT, '.env.example');
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅  .env file created from .env.example');
    console.log('   ⚠️  Please open .env and verify your database credentials before starting the server.');
  } else {
    console.error('❌  .env file is missing and no .env.example was found!');
    console.error('   Please create a .env file with the required variables (see README).\n');
    process.exit(1);
  }
} else {
  console.log('✅  .env file exists — OK');
}

// 3. Create required directories
const dirs = [
  path.join(ROOT, 'uploads'),
  path.join(ROOT, 'public'),
  path.join(ROOT, 'logs'),
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅  Created directory: ${path.relative(ROOT, dir)}/`);
  }
}

// 4. Check node_modules
if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
  console.error('\n❌  node_modules not found!');
  console.error('   Please run: npm install\n');
  process.exit(1);
} else {
  console.log('✅  node_modules installed — OK');
}

console.log('\n\ud83c\udf89  Setup complete! You can now start the server:');
console.log('   npm run dev\n');

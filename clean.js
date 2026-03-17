const fs = require('fs');
fs.rmSync('.next', { recursive: true, force: true });
console.log('Cleaned .next directory');

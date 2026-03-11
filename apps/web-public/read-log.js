const fs = require('fs');
const content = fs.readFileSync('build.log', 'utf8');
console.log(content.slice(-2000));

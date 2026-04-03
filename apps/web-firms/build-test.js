const { execSync } = require('child_process');
const fs = require('fs');
try {
    execSync('npx next build', { encoding: 'utf8', stdio: 'pipe' });
} catch (e) {
    fs.writeFileSync('error.log', e.stderr, 'utf8');
}

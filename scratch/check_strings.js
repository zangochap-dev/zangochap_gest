
const fs = require('fs');
const content = fs.readFileSync('e:\\zangochap_gest\\app\\zangochap-manager\\orders\\OrdersClient.tsx', 'utf8');
let inString = null;
let line = 1;
let col = 1;
for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '\n') { line++; col = 1; } else col++;

    if (!inString) {
        if (c === '"' || c === "'" || c === '`') inString = c;
    } else {
        if (c === inString && content[i-1] !== '\\') inString = null;
    }
}
console.log('Final inString:', inString);

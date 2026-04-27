
const fs = require('fs');
const content = fs.readFileSync('e:\\zangochap_gest\\app\\zangochap-manager\\orders\\OrdersClient.tsx', 'utf8');
let bt = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '`') bt++;
}
console.log('Backticks:', bt);


const fs = require('fs');
const content = fs.readFileSync('e:\\zangochap_gest\\app\\zangochap-manager\\orders\\OrdersClient.tsx', 'utf8');
let openInterpolation = 0;
let closeBrace = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '$' && content[i+1] === '{') openInterpolation++;
}
// This is hard because } is used for objects too.
console.log('Open Interpolation (${):', openInterpolation);

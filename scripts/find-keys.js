const fs = require('fs');

const raw = fs.readFileSync('C:/Users/natik/.gemini/antigravity/scratch/news5indiaa/scripts/insta_script.json', 'utf-8');

console.log('Keys in JSON:');
try {
  const parsed = JSON.parse(raw);
  console.log(Object.keys(parsed));
  // search text for 'xdt_api' or 'caption' or 'display_url' or 'shortcode'
  const matches = raw.match(/"xdt_api[^"]*"/g);
  console.log('xdt matches:', matches);
  const codeMatches = [...raw.matchAll(/"code":"([^"]+)"/g)].map(m => m[1]);
  console.log('Code matches:', codeMatches);
} catch(e) {
  console.error(e);
}

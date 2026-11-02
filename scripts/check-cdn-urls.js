const fs = require('fs');

const d = fs.readFileSync('C:/Users/natik/.gemini/antigravity/scratch/news5indiaa/scripts/fb_hit_response.html', 'utf-8');
const imgUrls = [...d.matchAll(/https:\/\/[^"'\s<>]+\.cdninstagram\.com\/[^"'\s<>]+/g)].map(m => m[0]);
console.log('Total URLs:', imgUrls.length);
imgUrls.slice(0, 10).forEach((u, i) => {
  // unescape html entities &amp;
  const clean = u.replace(/&amp;/g, '&');
  console.log(`[${i+1}]`, clean.slice(0, 100));
});

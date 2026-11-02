const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:/Users/natik/.gemini/antigravity/scratch/news5indiaa/scripts/insta_script.json', 'utf-8'));

function findEdges(obj) {
  let results = [];
  if (!obj || typeof obj !== 'object') return results;
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      results = results.concat(findEdges(item));
    }
    return results;
  }

  if (obj.shortcode || obj.code) {
    results.push(obj);
  }

  for (const k of Object.keys(obj)) {
    results = results.concat(findEdges(obj[k]));
  }
  return results;
}

const found = findEdges(data);
console.log('Total items with shortcode/code found:', found.length);

const unique = [];
const seen = new Set();
for (const item of found) {
  const code = item.shortcode || item.code;
  if (code && !seen.has(code)) {
    seen.add(code);
    unique.push(item);
  }
}

console.log('Unique items:', unique.length);

unique.slice(0, 5).forEach((p, idx) => {
  const code = p.shortcode || p.code;
  const caption = p.edge_media_to_caption?.edges?.[0]?.node?.text || p.caption?.text || p.accessibility_caption || 'News5Indiaa Instagram Post';
  const displayUrl = p.display_url || p.image_versions2?.candidates?.[0]?.url;
  const isVideo = p.is_video || p.media_type === 2;
  console.log(`\n--- Post #${idx + 1} (${code}) ---`);
  console.log('Caption:', caption.slice(0, 100));
  console.log('Image:', displayUrl ? displayUrl.slice(0, 80) + '...' : 'none');
  console.log('Is Video / Reel:', isVideo);
});

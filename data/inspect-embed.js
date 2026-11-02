const fs = require('fs');
const html = fs.readFileSync('C:/Users/natik/.gemini/antigravity/scratch/news5indiaa/data/insta-embed.html', 'utf8');

const pLinks = html.match(/https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+/g) || [];
console.log('Post / Reel links count:', pLinks.length);
console.log('Unique links:', [...new Set(pLinks)]);

const cdnMatches = html.match(/https:\/\/[^"'\s]+cdninstagram\.com[^"'\s]+/g) || [];
console.log('CDN images count:', cdnMatches.length);
if (cdnMatches.length > 0) {
  console.log('Sample image:', cdnMatches[0].slice(0, 100));
}

// Search for any username, captions, titles
const titleMatch = html.match(/<title>([^<]+)<\/title>/);
console.log('Page Title:', titleMatch ? titleMatch[1] : 'none');

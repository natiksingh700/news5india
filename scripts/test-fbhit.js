const https = require('https');
const fs = require('fs');

const url = 'https://www.instagram.com/news5indiaa/';
const ua = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

https.get(url, { headers: { 'User-Agent': ua, 'Accept-Language': 'hi-IN,en;q=0.9' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    fs.writeFileSync('C:/Users/natik/.gemini/antigravity/scratch/news5indiaa/scripts/fb_hit_response.html', d, 'utf-8');
    console.log('Saved fb_hit_response.html, size:', d.length);

    // Look for links to posts / reels
    const reels = [...d.matchAll(/(?:href="|\/)(?:p|reel)\/([A-Za-z0-9_-]+)/g)].map(m => m[1]);
    console.log('Found reel/post codes:', [...new Set(reels)]);

    // Look for image urls
    const imgUrls = [...d.matchAll(/https:\/\/[^"'\s]+\.cdninstagram\.com\/[^"'\s]+/g)].map(m => m[0]);
    console.log('Found cdninstagram URLs:', imgUrls.length);
  });
}).on('error', console.error);

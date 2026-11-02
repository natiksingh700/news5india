const https = require('https');

const options = {
  hostname: 'www.instagram.com',
  path: '/news5indiaa/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Mode': 'navigate'
  }
};

https.get(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Body length:', body.length);
    const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'not found');
    const descMatch = body.match(/content="([^"]+)"\s+name="description"/i) || body.match(/property="og:description"\s+content="([^"]+)"/i);
    console.log('Description:', descMatch ? descMatch[1] : 'not found');
    const imgMatch = body.match(/property="og:image"\s+content="([^"]+)"/i);
    console.log('Image:', imgMatch ? imgMatch[1] : 'not found');

    // Check for any embedded JSON or post shortcodes
    const shortcodes = [...body.matchAll(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/g)].map(m => m[1]);
    console.log('Found post/reel shortcodes:', [...new Set(shortcodes)].slice(0, 10));
  });
}).on('error', console.error);

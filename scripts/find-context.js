const https = require('https');

https.get('https://www.instagram.com/news5indiaa/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const postMatches = [...body.matchAll(/(?:\/p\/|\/reel\/)([A-Za-z0-9_-]+)/g)];
    const uniqueCodes = [...new Set(postMatches.map(m => m[1]))];
    console.log('Unique Shortcodes:', uniqueCodes);

    // Look around one shortcode to see surrounding text
    for (const code of uniqueCodes.slice(0, 3)) {
      const idx = body.indexOf(code);
      console.log(`\nContext around ${code}:`);
      console.log(body.substring(Math.max(0, idx - 150), Math.min(body.length, idx + 250)));
    }
  });
}).on('error', console.error);

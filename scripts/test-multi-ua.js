const https = require('https');

async function testFetchInstagram() {
  const url = 'https://www.instagram.com/news5indiaa/';
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
  ];

  for (const ua of userAgents) {
    console.log('\nTesting UA:', ua.slice(0, 30));
    try {
      const html = await new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': ua, 'Accept-Language': 'hi-IN,en;q=0.9' } }, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve(d));
        }).on('error', reject);
      });
      console.log('Got response length:', html.length);
      const title = html.match(/<title>([^<]+)<\/title>/i);
      console.log('Title:', title ? title[1] : 'null');
      const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/i);
      console.log('og:description:', ogDesc ? ogDesc[1] : 'null');
      const ogImg = html.match(/property="og:image"\s+content="([^"]+)"/i);
      console.log('og:image:', ogImg ? ogImg[1].slice(0, 60) + '...' : 'null');
    } catch(e) {
      console.error('Error:', e.message);
    }
  }
}

testFetchInstagram();

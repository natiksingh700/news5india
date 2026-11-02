const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'www.instagram.com',
  path: '/news5indiaa/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Fetch-Mode': 'navigate'
  }
};

https.get(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    // Check for script tags with JSON
    const scripts = [...body.matchAll(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi)];
    console.log('JSON scripts found:', scripts.length);

    let parsedCount = 0;
    for (let i = 0; i < scripts.length; i++) {
      const content = scripts[i][1];
      if (content.includes('shortcode') || content.includes('edge_owner_to_timeline_media') || content.includes('xdt_api__v1__feed__user_timeline_graphql_connection')) {
        console.log(`Script ${i} has timeline media! Length:`, content.length);
        fs.writeFileSync('C:/Users/natik/.gemini/antigravity/scratch/news5indiaa/scripts/insta_script.json', content, 'utf-8');
        parsedCount++;
      }
    }

    if (parsedCount === 0) {
      console.log('No direct timeline JSON, searching regex patterns for posts...');
      // search for display_url or shortcode matches
      const re = /"shortcode":"([^"]+)".*?"display_url":"([^"]+)".*?"accessibility_caption":"([^"]+)"/g;
      let m;
      let count = 0;
      while ((m = re.exec(body)) !== null && count < 5) {
        console.log('Matched post:', m[1], m[3]);
        count++;
      }
    }
  });
}).on('error', console.error);

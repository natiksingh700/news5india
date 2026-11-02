const https = require('https');
const data = JSON.stringify({
  caption: 'Test Auto Post from Node',
  permalink: 'https://www.instagram.com/p/TEST123/',
  media_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80',
  media_type: 'IMAGE'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/instagram-webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(data);
req.end();

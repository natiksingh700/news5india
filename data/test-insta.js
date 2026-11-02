const https = require('https');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'x-ig-app-id': '936619743392459',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.instagram.com/news5indiaa/'
  }
};

https.get('https://www.instagram.com/api/v1/users/web_profile_info/?username=news5indiaa', options, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      const user = json.data && json.data.user;
      if (user) {
        console.log('Username:', user.username);
        console.log('Full Name:', user.full_name);
        console.log('Bio:', user.biography);
        console.log('Profile Pic:', user.profile_pic_url);
        const timeline = user.edge_owner_to_timeline_media;
        if (timeline && timeline.edges) {
          console.log('Total posts fetched:', timeline.edges.length);
          timeline.edges.slice(0, 5).forEach((e, i) => {
            const node = e.node;
            console.log(i + 1, 'Shortcode:', node.shortcode);
            console.log('   Display URL:', node.display_url ? node.display_url.slice(0, 60) + '...' : 'none');
            const cap = node.edge_media_to_caption && node.edge_media_to_caption.edges && node.edge_media_to_caption.edges[0];
            console.log('   Caption:', cap ? cap.node.text.slice(0, 60) : 'none');
          });
        }
      } else {
        console.log('No user in response. Data snippet:', data.slice(0, 200));
      }
    } catch (err) {
      console.log('JSON parse error, status was:', res.statusCode, 'Data snippet:', data.slice(0, 200));
    }
  });
}).on('error', err => console.error(err.message));

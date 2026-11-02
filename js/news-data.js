// News5Indiaa: no fabricated/demo headlines are shipped to visitors.
// Live articles are populated only by server.js after publisher and freshness checks.
window.NEWS_DATA = {
  breaking: [],
  leadStory: null,
  articles: [],
  webStories: [],
  videos: [],
  cricketMatch: null,
  mostRead: []
};

var NEWS_DATA = window.NEWS_DATA;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.NEWS_DATA;
}

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();
const { pool, initDB } = require('./db.js');

// Initialize database tables on start
// Database initialization and admin bootstrap run together below.

let PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'live-news.json');
const EN_DATA_FILE = path.join(ROOT, 'data', 'live-news-en.json');
const INSTA_DATA_FILE = path.join(ROOT, 'data', 'instagram-stories.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/* ==========================================================================
   24x7 MULTI-CATEGORY REAL NEWS ENGINE (Google News RSS — 100% Real News)
   Fetches REAL headlines from Google News Hindi RSS every 5 minutes
   Categories: National, World, States, Entertainment/OTT, Sports, Business, Tech
   ========================================================================== */

// ─── RSS Feed Config ──────────────────────────────────────────────────────────
// Each feed: { url, category, categorySlug, state?, stateName?, author, image pool }
// Extra coverage: entertainment release calendars, technology, civic and public-interest beats.
// These are RSS discovery feeds; publication still passes the publisher, freshness and review gates below.
const EXTRA_FEEDS = [
  { query: '"upcoming movies" OR "release date" India Bollywood Hollywood', category: 'फिल्में', slug: 'movies', author: 'News5Indiaa फिल्म डेस्क', maxItems: 3 },
  { query: '"upcoming web series" OR OTT release date Netflix Prime Video JioHotstar India', category: 'वेब सीरीज़ और OTT', slug: 'ott', author: 'News5Indiaa OTT डेस्क', maxItems: 3 },
  { query: 'movie trailer teaser announcement India cinema', category: 'ट्रेलर और टीज़र', slug: 'trailers', author: 'News5Indiaa ट्रेलर डेस्क', maxItems: 2 },
  { query: 'Bollywood Hollywood box office collection film review', category: 'बॉक्स ऑफिस', slug: 'boxoffice', author: 'News5Indiaa सिनेमा डेस्क', maxItems: 2 },
  { query: 'television serial reality show celebrity entertainment India', category: 'टीवी और सेलिब्रिटी', slug: 'entertainment', author: 'News5Indiaa टीवी डेस्क', maxItems: 2 },
  { query: 'artificial intelligence AI technology India latest', category: 'AI और टेक्नोलॉजी', slug: 'ai', author: 'News5Indiaa AI डेस्क', maxItems: 3 },
  { query: 'smartphone launch laptop gadget review India', category: 'मोबाइल और गैजेट्स', slug: 'gadgets', author: 'News5Indiaa गैजेट्स डेस्क', maxItems: 3 },
  { query: 'cybersecurity data breach software technology India', category: 'साइबर और डिजिटल', slug: 'tech', author: 'News5Indiaa साइबर डेस्क', maxItems: 2 },
  { query: 'gaming esports game launch gaming industry India', category: 'गेमिंग और ई-स्पोर्ट्स', slug: 'gaming', author: 'News5Indiaa गेमिंग डेस्क', maxItems: 2 },
  { query: 'electric vehicle car bike automobile launch India', category: 'ऑटो और EV', slug: 'auto', author: 'News5Indiaa ऑटो डेस्क', maxItems: 2 },
  { query: 'ISRO space science research discovery India', category: 'विज्ञान और अंतरिक्ष', slug: 'science', author: 'News5Indiaa साइंस डेस्क', maxItems: 2 },
  { query: 'school university education exam result admission India', category: 'शिक्षा और परीक्षा', slug: 'education', author: 'News5Indiaa शिक्षा डेस्क', maxItems: 3 },
  { query: 'government jobs recruitment vacancy admit card result India', category: 'सरकारी नौकरी और भर्ती', slug: 'jobs', author: 'News5Indiaa जॉब्स डेस्क', maxItems: 3 },
  { query: 'startup funding business economy markets India', category: 'स्टार्टअप और अर्थव्यवस्था', slug: 'business', author: 'News5Indiaa स्टार्टअप डेस्क', maxItems: 2 },
  { query: 'health public health medical research India', category: 'स्वास्थ्य समाचार', slug: 'health', author: 'News5Indiaa हेल्थ डेस्क', maxItems: 2 },
  { query: 'weather monsoon IMD rainfall heatwave India', category: 'मौसम और मानसून', slug: 'weather', author: 'News5Indiaa मौसम डेस्क', maxItems: 2 },
  { query: 'agriculture farmers crop mandi agriculture policy India', category: 'कृषि और किसान', slug: 'agriculture', author: 'News5Indiaa कृषि डेस्क', maxItems: 2 },
  { query: 'environment climate pollution conservation India', category: 'पर्यावरण', slug: 'environment', author: 'News5Indiaa पर्यावरण डेस्क', maxItems: 2 },
  { query: 'Mathura Vrindavan local news administration police', category: 'मथुरा-वृंदावन', slug: 'state', state: 'up', stateName: 'मथुरा-वृंदावन', author: 'News5Indiaa मथुरा ब्यूरो', maxItems: 3 },
  { query: 'Agra local news administration police Uttar Pradesh', category: 'आगरा', slug: 'state', state: 'up', stateName: 'आगरा', author: 'News5Indiaa आगरा ब्यूरो', maxItems: 2 }
];

function buildSearchFeed(feed) {
  return {
    url: 'https://news.google.com/rss/search?q=' + encodeURIComponent(feed.query) + '&hl=hi&gl=IN&ceid=IN:hi',
    category: feed.category,
    categorySlug: feed.slug,
    state: feed.state,
    stateName: feed.stateName,
    author: feed.author,
    maxItems: feed.maxItems,
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80'
    ]
  };
}

const FEED_CONFIG = [
  // ── National (देश) ──
  {
    url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=hi&gl=IN&ceid=IN:hi',
    category: 'देश',
    categorySlug: 'national',
    author: 'News5Indiaa राष्ट्रीय डेस्क',
    maxItems: 4,
    images: [
      'https://images.unsplash.com/photo-1532375810709-75b1da00a3b4?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609946860441-a51ffcf22208?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── World (विश्व) ──
  {
    url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=hi&gl=IN&ceid=IN:hi',
    category: 'विश्व',
    categorySlug: 'world',
    author: 'News5Indiaa अंतरराष्ट्रीय डेस्क',
    maxItems: 3,
    images: [
      'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Entertainment / Bollywood / OTT ──
  {
    url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=hi&gl=IN&ceid=IN:hi',
    category: 'मनोरंजन',
    categorySlug: 'entertainment',
    author: 'News5Indiaa बॉलीवुड डेस्क',
    maxItems: 4,
    images: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Sports / Cricket ──
  {
    url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=hi&gl=IN&ceid=IN:hi',
    category: 'खेल',
    categorySlug: 'sports',
    author: 'News5Indiaa स्पोर्ट्स डेस्क',
    maxItems: 3,
    images: [
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1461896836934-bd45ba8a6d3c?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Business / Share Market ──
  {
    url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=hi&gl=IN&ceid=IN:hi',
    category: 'बिज़नेस',
    categorySlug: 'business',
    author: 'News5Indiaa बिज़नेस डेस्क',
    maxItems: 3,
    images: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Technology / Gadgets ──
  {
    url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=hi&gl=IN&ceid=IN:hi',
    category: 'टेक्नोलॉजी',
    categorySlug: 'tech',
    author: 'News5Indiaa टेक डेस्क',
    maxItems: 2,
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Movies & OTT / Web Series (Search-based for fresh movie+series news) ──
  {
    url: 'https://news.google.com/rss/search?q=नई+फिल्म+OR+OTT+रिलीज+OR+वेब+सीरीज+OR+Netflix+OR+trailer&hl=hi&gl=IN&ceid=IN:hi',
    category: 'मनोरंजन',
    categorySlug: 'entertainment',
    author: 'News5Indiaa OTT डेस्क',
    maxItems: 3,
    images: [
      'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Uttar Pradesh (State) ──
  {
    url: 'https://news.google.com/rss/search?q=उत्तर+प्रदेश+OR+लखनऊ+OR+नोएडा+OR+प्रयागराज+OR+वाराणसी&hl=hi&gl=IN&ceid=IN:hi',
    category: 'राज्य',
    categorySlug: 'state',
    state: 'up',
    stateName: 'उत्तर प्रदेश',
    author: 'News5Indiaa यूपी ब्यूरो',
    maxItems: 3,
    images: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585136917228-c5db4b7b9cf2?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Delhi NCR (State) ──
  {
    url: 'https://news.google.com/rss/search?q=दिल्ली+OR+गुरुग्राम+OR+NCR+OR+नई+दिल्ली&hl=hi&gl=IN&ceid=IN:hi',
    category: 'राज्य',
    categorySlug: 'state',
    state: 'delhi',
    stateName: 'दिल्ली NCR',
    author: 'News5Indiaa दिल्ली ब्यूरो',
    maxItems: 3,
    images: [
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1597040663342-45b6ba68fa1b?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Bihar (State) ──
  {
    url: 'https://news.google.com/rss/search?q=बिहार+OR+पटना+OR+गया+OR+मुजफ्फरपुर&hl=hi&gl=IN&ceid=IN:hi',
    category: 'राज्य',
    categorySlug: 'state',
    state: 'bihar',
    stateName: 'बिहार',
    author: 'News5Indiaa बिहार ब्यूरो',
    maxItems: 2,
    images: [
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583318432730-5e3f5092f4c5?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Madhya Pradesh (State) ──
  {
    url: 'https://news.google.com/rss/search?q=मध्य+प्रदेश+OR+भोपाल+OR+इंदौर+OR+जबलपुर&hl=hi&gl=IN&ceid=IN:hi',
    category: 'राज्य',
    categorySlug: 'state',
    state: 'mp',
    stateName: 'मध्य प्रदेश',
    author: 'News5Indiaa MP ब्यूरो',
    maxItems: 2,
    images: [
      'https://images.unsplash.com/photo-1590050751117-238cb0fb12b1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583318432728-5e3f5092f4c5?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Rajasthan (State) ──
  {
    url: 'https://news.google.com/rss/search?q=राजस्थान+OR+जयपुर+OR+जोधपुर+OR+उदयपुर&hl=hi&gl=IN&ceid=IN:hi',
    category: 'राज्य',
    categorySlug: 'state',
    state: 'rajasthan',
    stateName: 'राजस्थान',
    author: 'News5Indiaa राजस्थान ब्यूरो',
    maxItems: 2,
    images: [
      'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=80'
    ]
  },
  // ── Politics (राजनीति) ──
  {
    url: 'https://news.google.com/rss/search?q=राजनीति+OR+मोदी+OR+संसद+OR+चुनाव+OR+BJP+OR+कांग्रेस&hl=hi&gl=IN&ceid=IN:hi',
    category: 'राजनीति',
    categorySlug: 'politics',
    author: 'News5Indiaa पॉलिटिकल डेस्क',
    maxItems: 3,
    images: [
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=600&auto=format&fit=crop&q=80'
    ]
  },
  ...EXTRA_FEEDS.map(buildSearchFeed)
];

// ─── Fetch Utility (follows redirects) ────────────────────────────────────────
function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 12000);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timeout);
        return resolve(fetchRaw(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { clearTimeout(timeout); resolve(data); });
    }).on('error', (err) => { clearTimeout(timeout); reject(err); });
  });
}

// Only publish items attributed to established, identifiable news publishers.
// This filter improves source quality; it cannot guarantee that every report is true.
const TRUSTED_PUBLISHER_PATTERNS = [
  "the hindu", "indian express", "hindustan times", "times of india", "ndtv",
  "india today", "bbc news", "reuters", "associated press", "press trust of india",
  "pti", "ani", "aaj tak", "abp news", "zee news", "news18", "tv9 bharatvarsh",
  "etv bharat", "dd news", "amar ujala", "dainik jagran", "live hindustan",
  "hindustan", "economic times", "business standard", "mint", "cnbc-tv18",
  "moneycontrol", "espncricinfo", "cricbuzz", "the quint", "scroll.in",
  "the wire", "deccan herald", "the telegraph", "india tv", "pib",
  "दैनिक जागरण", "अमर उजाला", "हिन्दुस्तान", "आज तक", "एबीपी न्यूज़",
  "एनडीटीवी", "इंडिया टीवी", "बीबीसी हिंदी", "पीटीआई", "एएनआई", "न्यूज़18", "ज़ी न्यूज़",
  "bollywood hungama", "pinkvilla", "filmibeat", "koimoi", "variety", "deadline",
  "hollywood reporter", "gadgets 360", "91mobiles", "gsmarena", "ign", "autocar india",
  "carandbike", "imdb", "espn", "cricbuzz", "the hindu businessline", "financial express",
  "careers360", "indian express education", "down to earth", "weather.com", "imd"
];

function isTrustedPublisher(source) {
  const normalized = String(source || "").toLowerCase().replace(/\s+/g, " ").trim();
  return !!normalized && TRUSTED_PUBLISHER_PATTERNS.some(name => normalized === name || normalized.includes(name));
}

function requiresEditorialReview(item) {
  const text = `${item.title || ""} ${item.description || ""}`;
  // High-impact/sensitive claims are not auto-published; an editor must verify them first.
  return /(बलात्कार|यौन शोषण|नाबालिग|हत्या|मौत|मृत्यु|दंगा|सांप्रदायिक|धार्मिक तनाव|जातीय हिंसा|आतंक|आतंकी|आरोपी|गिरफ्तार|चुनाव परिणाम|मतदान|एग्जिट पोल|भूकंप|बाढ़|महामारी|वैक्सीन|rape|sexual assault|minor|murder|death|riot|communal|terror|accused|arrest|election result|exit poll|earthquake|flood|pandemic|vaccine)/i.test(text);
}

function isRecentArticle(pubDate) {
  const published = Date.parse(pubDate || "");
  if (!Number.isFinite(published)) return false;
  const age = Date.now() - published;
  return age >= -60 * 60 * 1000 && age <= 72 * 60 * 60 * 1000;
}

// ─── XML Parser (extracts title + description + pubDate + source) ─────────────
function cleanHtmlEntities(str) {
  return str
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
}

function stripAllHtml(str) {
  // First decode HTML entities, then strip all HTML tags, then clean up
  let decoded = cleanHtmlEntities(str);
  decoded = decoded.replace(/<[^>]*>?/gm, ''); // strip actual HTML tags
  decoded = decoded.replace(/https?:\/\/\S+/g, ''); // strip raw URLs
  decoded = decoded.replace(/\s{2,}/g, ' ').trim();
  return decoded;
}

function parseXmlItems(xml, maxItems) {
  const items = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  for (const itemXml of itemMatches.slice(0, maxItems || 6)) {
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
    const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
    if (titleMatch && titleMatch[1]) {
      const rawTitle = stripAllHtml(titleMatch[1]);
      // Remove the " - Source" suffix Google News adds
      const dashIdx = rawTitle.lastIndexOf(' - ');
      const title = dashIdx > 20 ? rawTitle.substring(0, dashIdx).trim() : rawTitle;
      const source = sourceMatch ? stripAllHtml(sourceMatch[1]) : (dashIdx > 20 ? rawTitle.substring(dashIdx + 3).trim() : '');
      
      // Clean the description — strip ALL HTML, entities, and URLs
      let desc = '';
      if (descMatch && descMatch[1]) {
        desc = stripAllHtml(descMatch[1]);
        // Remove duplicate source names that Google News adds in description
        if (desc.length < 10 || desc === title) desc = '';
        desc = desc.substring(0, 300);
      }

      items.push({
        title,
        source,
        description: desc,
        pubDate: dateMatch ? dateMatch[1].trim() : '',
        articleUrl: linkMatch ? cleanHtmlEntities(linkMatch[1].trim()) : ''
      });
    }
  }
  return items;
}

// ─── Format relative time in Hindi ────────────────────────────────────────────
function formatHindiTime(pubDateStr) {
  if (!pubDateStr) return 'अभी-अभी';
  try {
    const pub = new Date(pubDateStr);
    const now = new Date();
    const diffMs = now - pub;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 2) return 'अभी-अभी';
    if (diffMin < 60) return `${diffMin} मिनट पहले`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} घंटे पहले`;
    return `${Math.floor(diffHr / 24)} दिन पहले`;
  } catch { return 'अभी-अभी'; }
}

// ─── Main Engine: Fetches ALL categories, builds unified article list ─────────
const ENGLISH_CATEGORY_NAMES = {
  'देश':'National', 'विश्व':'World', 'मनोरंजन':'Entertainment', 'खेल':'Sports',
  'बिज़नेस':'Business', 'टेक्नोलॉजी':'Technology', 'राज्य':'States',
  'राजनीति':'Politics', 'फिल्में':'Movies', 'वेब सीरीज़ और OTT':'Web Series & OTT',
  'ट्रेलर और टीज़र':'Trailers & Teasers', 'बॉक्स ऑफिस':'Box Office',
  'टीवी और सेलिब्रिटी':'TV & Celebrities', 'AI और टेक्नोलॉजी':'AI & Technology',
  'मोबाइल और गैजेट्स':'Mobiles & Gadgets', 'साइबर और डिजिटल':'Cyber & Digital',
  'गेमिंग और ई-स्पोर्ट्स':'Gaming & Esports', 'ऑटो और EV':'Auto & EV',
  'विज्ञान और अंतरिक्ष':'Science & Space', 'शिक्षा और परीक्षा':'Education',
  'सरकारी नौकरी और भर्ती':'Government Jobs', 'स्टार्टअप और अर्थव्यवस्था':'Startups & Economy',
  'स्वास्थ्य समाचार':'Health', 'मौसम और मानसून':'Weather', 'कृषि और किसान':'Agriculture',
  'पर्यावरण':'Environment', 'मथुरा-वृंदावन':'Mathura-Vrindavan', 'आगरा':'Agra'
};

function feedsForLanguage(language) {
  if (language !== 'en') return FEED_CONFIG;
  return FEED_CONFIG.map(feed => ({
    ...feed,
    url: feed.url.replace(/hl=hi/g, 'hl=en-IN').replace(/ceid=IN:hi/g, 'ceid=IN:en'),
    category: ENGLISH_CATEGORY_NAMES[feed.category] || feed.category,
    stateName: feed.stateName === 'उत्तर प्रदेश' ? 'Uttar Pradesh' :
      feed.stateName === 'दिल्ली NCR' ? 'Delhi NCR' : feed.stateName,
    author: 'News5India News Desk'
  }));
}

let updateCycle = 0;
async function autoUpdateAllNews(language = 'hi') {
  updateCycle++;
  const allArticles = [];
  const seenTitles = new Set();
  const ts = Date.now();

  const activeFeeds = feedsForLanguage(language);
  const targetDataFile = language === 'en' ? EN_DATA_FILE : DATA_FILE;
  console.log(`\n🔄 [Cycle #${updateCycle}] Fetching ${language.toUpperCase()} news from ${activeFeeds.length} feeds...`);

  // Fetch feeds in small parallel batches so language refreshes finish promptly.
  for (let batchStart = 0; batchStart < activeFeeds.length; batchStart += 6) {
    const batch = activeFeeds.slice(batchStart, batchStart + 6);
    await Promise.all(batch.map(async feed => {
    try {
      const rawXml = await fetchRaw(feed.url);
      const parsedItems = parseXmlItems(rawXml, Math.max(feed.maxItems * 5, 20));
      const items = parsedItems.filter(item => isTrustedPublisher(item.source) && /^https:\/\//i.test(item.articleUrl) && isRecentArticle(item.pubDate) && !requiresEditorialReview(item)).slice(0, feed.maxItems);
      console.log('   🔎 ' + feed.category + ': ' + (parsedItems.length - items.length) + ' items withheld (untrusted source, stale date, or editorial review required)');

      items.forEach((item, i) => {
        // Deduplicate by title substring
        const key = item.title.substring(0, 40).toLowerCase();
        if (seenTitles.has(key)) return;
        seenTitles.add(key);

        const cleanExcerpt = item.description && item.description.length > 10 ? item.description : item.title;
        const cleanContent = language === 'en' ? '<p><strong>News summary from source:</strong> ' + item.title + '</p>' + (cleanExcerpt !== item.title ? '<p>' + cleanExcerpt + '</p>' : '') + '<p>This summary is based on information available in the RSS feed. Read the original report for full details.</p>' : '<p><strong>स्रोत से प्राप्त समाचार-संक्षेप:</strong> ' + item.title + '</p>' + (cleanExcerpt !== item.title ? '<p>' + cleanExcerpt + '</p>' : '') + '<p>यह संक्षेप RSS में उपलब्ध जानकारी पर आधारित है। पूरी रिपोर्ट के लिए मूल स्रोत देखें।</p>';

        const article = {
          id: `live-${language}-${feed.categorySlug}-${ts}-${allArticles.length}`,
          title: item.title,
          excerpt: cleanExcerpt,
          category: feed.category,
          categorySlug: feed.categorySlug,
          author: feed.author + (item.source ? ` (${item.source})` : ''),
          date: language === 'en' ? new Date(item.pubDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : formatHindiTime(item.pubDate),
          publishedAt: item.pubDate || null,
          source: item.source,
          articleUrl: item.articleUrl,
          readTime: language === 'en' ? '2 min' : '2 मिनट',
          image: feed.images[i % feed.images.length],
          views: "—",
          content: cleanContent
        };

        // Add state info if present
        if (feed.state) {
          article.state = feed.state;
          article.stateName = feed.stateName;
        }

        allArticles.push(article);
      });

      console.log(`   ✅ ${feed.category}${feed.stateName ? ' (' + feed.stateName + ')' : ''}: ${items.length} real headlines fetched`);
    } catch (err) {
      console.log(`   ⚠️ ${feed.category}${feed.stateName ? ' (' + feed.stateName + ')' : ''}: ${err.message}`);
    }
    }));
  }

  if (allArticles.length > 0) {
    // Put the newest RSS publication first so the homepage lead and ticker are current.
    allArticles.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
    const payload = {
      lastUpdated: new Date().toISOString(),
      totalArticles: allArticles.length,
      articles: allArticles
    };
    fs.writeFileSync(targetDataFile, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`🤖 [News5Indiaa AI Engine] Total ${allArticles.length} REAL news articles saved! (Cycle #${updateCycle})\n`);

    // ── Save/Upsert Articles to Neon PostgreSQL Database ──
    try {
      const client = await pool.connect();
      try {
        for (const art of allArticles) {
          await client.query(`
            INSERT INTO articles (id, title, excerpt, category, category_slug, author, date, read_time, image, views, content, state, state_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE SET
              views = EXCLUDED.views,
              date = EXCLUDED.date;
          `, [
            art.id, art.title, art.excerpt, art.category, art.categorySlug,
            art.author, art.date, art.readTime, art.image, art.views,
            art.content, art.state || null, art.stateName || null
          ]);
        }
        console.log(`💾 [Neon DB] Synchronized ${allArticles.length} articles to PostgreSQL database!`);
      } finally {
        client.release();
      }
    } catch (dbErr) {
      console.error('⚠️ [Neon DB] Articles sync warning:', dbErr.message);
    }
  } else {
    // Clear stale headlines when no fresh, allowlisted articles pass the checks.
    const emptyPayload = { lastUpdated: new Date().toISOString(), totalArticles: 0, articles: [] };
    fs.writeFileSync(targetDataFile, JSON.stringify(emptyPayload, null, 2), 'utf-8');
    console.log(`⚠️ [Cycle #${updateCycle}] No trusted, recent articles passed the checks.\n`);
  }
}

// ─── Automated Instagram Poller for @news5indiaa ─────────────────────────
async function pollInstagramLive() {
  try {
    const url = 'https://www.instagram.com/news5indiaa/';
    const html = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept-Language': 'hi-IN,en;q=0.9'
        },
        timeout: 10000
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(d));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });

    if (html && html.length > 50000) {
      console.log(`📸 [Instagram 24x7 Live Poller] @news5indiaa sync check: ACTIVE (Page size: ${Math.round(html.length/1024)} KB)`);
    }
  } catch (err) {
    // Silent failover
  }
}

// ─── Start Engine: Immediately + Every 5 minutes ─────────────────────────────
autoUpdateAllNews('hi');
autoUpdateAllNews('en');
setInterval(() => autoUpdateAllNews('hi'), 5 * 60 * 1000);
setInterval(() => autoUpdateAllNews('en'), 5 * 60 * 1000);
pollInstagramLive();
setInterval(pollInstagramLive, 5 * 60 * 1000);

/* ==========================================================================
   HTTP WEB SERVER
   ========================================================================== */

const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(48).toString('hex');
const SESSION_COOKIE = 'n5_session';
const SESSION_TTL = 604800;
async function hashPass(pass) {
  const salt=crypto.randomBytes(16).toString('hex');
  return salt+':'+Buffer.from(await scrypt(pass,salt,64)).toString('hex');
}
async function verifyPass(pass,stored) {
  try {const [salt,hash]=stored.split(':');const actual=Buffer.from(await scrypt(pass,salt,64)).toString('hex');const a=Buffer.from(hash,'hex'),b=Buffer.from(actual,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b);}catch{return false;}
}
function sessionFor(user) {
  const payload=Buffer.from(JSON.stringify({id:user.id,username:user.username,role:user.role,exp:Math.floor(Date.now()/1000)+SESSION_TTL})).toString('base64url');
  return payload+'.'+crypto.createHmac('sha256',SESSION_SECRET).update(payload).digest('base64url');
}
function currentSession(req) {
  const item=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(SESSION_COOKIE+'='));
  if(!item)return null;const parts=item.slice(SESSION_COOKIE.length+1).split('.');
  if(parts.length!==2)return null;
  const expected=crypto.createHmac('sha256',SESSION_SECRET).update(parts[0]).digest(),got=Buffer.from(parts[1],'base64url');
  if(expected.length!==got.length||!crypto.timingSafeEqual(expected,got))return null;
  try{const u=JSON.parse(Buffer.from(parts[0],'base64url').toString());return u.exp>Date.now()/1000?u:null;}catch{return null;}
}
function setCookie(res,value,age=SESSION_TTL){res.setHeader('Set-Cookie',SESSION_COOKIE+'='+value+'; HttpOnly; Path=/; SameSite=Lax; Max-Age='+age+(process.env.NODE_ENV==='production'?'; Secure':''));}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function readBody(req,maxBytes=1000000){return new Promise((resolve,reject)=>{let b='',size=0;req.on('data',c=>{size+=c.length;if(size>maxBytes){reject(new Error('Too large'));req.destroy();return;}b+=c.toString('utf8');});req.on('end',()=>{try{resolve(JSON.parse(b||'{}'));}catch{reject(new Error('Invalid JSON'));}});req.on('error',reject);});}
async function initAdmin(){
  const password=process.env.ADMIN_PASSWORD,email=process.env.ADMIN_EMAIL||'admin_news5india@news5india.local',username=process.env.ADMIN_USERNAME||'admin_news5india';
  if(!password||!email){console.warn('Admin setup needs ADMIN_PASSWORD and ADMIN_EMAIL environment variables.');return;}
  const hash=await hashPass(password);
  await pool.query("INSERT INTO users(username,email,password_hash,role) VALUES($1,$2,$3,'admin') ON CONFLICT(username) DO UPDATE SET email=EXCLUDED.email,password_hash=EXCLUDED.password_hash,role='admin'",[username,email,hash]);
}
initDB().then(initAdmin).catch(e=>console.error('Database initialization failed:',e.message));
async function authRoute(req,res,path){
  if(path==='/api/auth/me'&&req.method==='GET'){const u=currentSession(req);return json(res,200,{authenticated:!!u,user:u?{id:u.id,username:u.username,role:u.role}:null});}
  if(path==='/api/auth/logout'&&req.method==='POST'){setCookie(res,'',0);return json(res,200,{success:true});}
  if(path==='/api/auth/register'&&req.method==='POST'){
    try{const x=await readBody(req),username=String(x.username||'').trim(),email=String(x.email||'').trim().toLowerCase(),password=String(x.password||'');
      if(!/^[a-zA-Z0-9_]{3,40}$/.test(username))return json(res,400,{error:'Username 3-40 अक्षर का रखें।'});
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,400,{error:'सही ईमेल डालें।'});
      if(password.length<8||password.length>128)return json(res,400,{error:'Password 8-128 अक्षर का होना चाहिए।'});
      const hash=await hashPass(password),q=await pool.query("INSERT INTO users(username,email,password_hash,role) VALUES($1,$2,$3,'user') RETURNING id,username,role",[username,email,hash]);
      setCookie(res,sessionFor(q.rows[0]));return json(res,201,{success:true,user:q.rows[0]});
    }catch(e){return json(res,e.code==='23505'?409:400,{error:e.code==='23505'?'Username या email पहले से मौजूद है।':'अकाउंट नहीं बन पाया।'});}
  }
  if(path==='/api/auth/login'&&req.method==='POST'){
    try{const x=await readBody(req),identifier=String(x.identifier||'').trim(),q=await pool.query('SELECT id,username,password_hash,role FROM users WHERE lower(username)=lower($1) OR lower(email)=lower($1) LIMIT 1',[identifier]),u=q.rows[0];
      if(!u||!(await verifyPass(String(x.password||''),u.password_hash)))return json(res,401,{error:'Username/email या password गलत है।'});
      setCookie(res,sessionFor(u));return json(res,200,{success:true,user:{id:u.id,username:u.username,role:u.role}});
    }catch(e){return json(res,500,{error:'Login नहीं हो पाया।'});}
  }
  return json(res,404,{error:'Not found'});
}

async function getInstagramThumbnail(videoUrl) {
  try {
    const parsed = new URL(videoUrl);
    if (!['instagram.com', 'www.instagram.com'].includes(parsed.hostname) ||
        !/^\/(reel|p)\/[A-Za-z0-9_-]+/.test(parsed.pathname)) return null;
    const response = await fetch(parsed.href, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; News5India/1.0)', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return null;
    const finalUrl = new URL(response.url);
    if (!['instagram.com', 'www.instagram.com'].includes(finalUrl.hostname)) return null;
    const html = await response.text();
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of tags) {
      if (!/property\s*=\s*["']og:image["']/i.test(tag) && !/name\s*=\s*["']twitter:image["']/i.test(tag)) continue;
      const match = tag.match(/content\s*=\s*["']([^"']+)["']/i);
      if (match && /^https:\/\//i.test(match[1])) return match[1].replace(/&amp;/g, '&').replace(/&#038;/g, '&');
    }
  } catch (e) {
    console.warn('Instagram thumbnail auto-detect unavailable:', e.message);
  }
  return null;
}

function startServer(portToTry) {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (pathname.startsWith('/api/auth/')) return authRoute(req,res,pathname);
    if (pathname === '/api/reels' && req.method === 'GET') {
      try { const q=await pool.query('SELECT id,title,description,video_url,thumbnail_url,category,created_at FROM reels ORDER BY created_at DESC'); return json(res,200,{reels:q.rows}); }
      catch(e) { return json(res,500,{error:'रील्स लोड नहीं हो पाईं।'}); }
    }
    if (pathname === '/api/reels/saved' && req.method === 'GET') {
      const user=currentSession(req);
      if(!user) return json(res,401,{error:'रील सेव करने के लिए पहले लॉगिन करें।'});
      try {
        const q=await pool.query(`SELECT r.id,r.title,r.description,r.video_url,r.thumbnail_url,r.category,r.created_at
          FROM saved_reels s JOIN reels r ON r.id=s.reel_id
          WHERE s.user_id=$1 ORDER BY s.created_at DESC`,[user.id]);
        return json(res,200,{reels:q.rows});
      } catch(e) { return json(res,500,{error:'सेव की गई रील्स लोड नहीं हो पाईं।'}); }
    }
    const saveReel=pathname.match(/^\/api\/reels\/(\d+)\/saved$/);
    if(saveReel && (req.method==='POST'||req.method==='DELETE')) {
      const user=currentSession(req);
      if(!user) return json(res,401,{error:'रील सेव करने के लिए पहले लॉगिन करें।'});
      try {
        if(req.method==='POST') {
          const exists=await pool.query('SELECT id FROM reels WHERE id=$1',[saveReel[1]]);
          if(!exists.rowCount) return json(res,404,{error:'यह रील उपलब्ध नहीं है।'});
          await pool.query('INSERT INTO saved_reels(user_id,reel_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[user.id,saveReel[1]]);
          return json(res,200,{success:true,saved:true});
        }
        await pool.query('DELETE FROM saved_reels WHERE user_id=$1 AND reel_id=$2',[user.id,saveReel[1]]);
        return json(res,200,{success:true,saved:false});
      } catch(e) { return json(res,500,{error:'रील की सेव स्थिति अपडेट नहीं हो पाई।'}); }
    }
    if (pathname === '/api/reels' && req.method === 'POST') {
      const user=currentSession(req);
      if(!user || user.role!=='admin') return json(res,403,{error:'यह सुविधा केवल Admin के लिए है।'});
      try {
        const x=await readBody(req),title=String(x.title||'').trim(),description=String(x.description||'').trim(),video=String(x.videoUrl||'').trim(),thumb=String(x.thumbnailUrl||'').trim(),category=String(x.category||'Other').slice(0,80);
        const valid=v=>{try{return ['http:','https:'].includes(new URL(v).protocol);}catch{return false;}};
        if(!title||title.length>180||!description||description.length>3000||!valid(video)||(thumb&&!valid(thumb))) return json(res,400,{error:'Title, description और सही video URL जरूरी हैं।'});
        const finalThumb = thumb || await getInstagramThumbnail(video);
        const q=await pool.query('INSERT INTO reels(title,description,video_url,thumbnail_url,category,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,title,description,video_url,thumbnail_url,category,created_at',[title,description,video,finalThumb||null,category,user.id]);
        return json(res,201,{success:true,reel:q.rows[0]});
      } catch(e) { console.error('Reel publish:',e.message); return json(res,400,{error:'रील पब्लिश नहीं हो पाई।'}); }
    }
    const deleteReel=pathname.match(/^\/api\/reels\/(\d+)$/);
    if(deleteReel && req.method==='DELETE') {
      const user=currentSession(req);
      if(!user||user.role!=='admin') return json(res,403,{error:'केवल Admin रील हटा सकता है।'});
      try { await pool.query('DELETE FROM reels WHERE id=$1',[deleteReel[1]]); return json(res,200,{success:true}); }
      catch(e) { return json(res,500,{error:'रील हटाई नहीं जा सकी।'}); }
    }

    // Publicly show up to three active sidebar ad slots.
    if (pathname === '/api/advertisements' && req.method === 'GET') {
      try {
        const q=await pool.query('SELECT id,slot_no,title,sponsor,click_url,image_data,mime_type,created_at FROM advertisements WHERE is_active=TRUE ORDER BY slot_no ASC');
        return json(res,200,{advertisements:q.rows});
      } catch(e) {
        console.error('Advertisement load:',e.message);
        return json(res,500,{error:'विज्ञापन लोड नहीं हो पाया।'});
      }
    }
    // Admin can create up to three ads. Uploading to an occupied slot replaces only that slot.
    if (pathname === '/api/advertisements' && req.method === 'POST') {
      const user=currentSession(req);
      if(!user || user.role!=='admin') return json(res,403,{error:'यह सुविधा केवल Admin के लिए है।'});
      let client;
      try {
        const x=await readBody(req,4_000_000),slotNo=Number(x.slotNo);
        const title=String(x.title||'').trim().slice(0,140),sponsor=String(x.sponsor||'प्रायोजित').trim().slice(0,100);
        const clickUrl=String(x.clickUrl||'').trim(),image=String(x.imageData||'');
        const match=image.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
        const validUrl=v=>{try{return ['http:','https:'].includes(new URL(v).protocol);}catch{return false;}};
        if(![1,2,3].includes(slotNo)||!title||!match||(clickUrl&&!validUrl(clickUrl))) return json(res,400,{error:'1 से 3 में Ad Slot चुनें, नाम और सही इमेज डालें।'});
        const mime='image/'+match[1],bytes=Buffer.from(match[2],'base64');
        if(bytes.length>2_500_000)return json(res,413,{error:'इमेज 2.5 MB से छोटी रखें।'});
        const signatureOk=mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
          :mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255
          :bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
        if(!signatureOk)return json(res,400,{error:'इमेज फाइल सही PNG, JPG या WEBP होनी चाहिए।'});
        client=await pool.connect();await client.query('BEGIN');
        await client.query('UPDATE advertisements SET is_active=FALSE WHERE slot_no=$1 AND is_active=TRUE',[slotNo]);
        const q=await client.query('INSERT INTO advertisements(slot_no,title,sponsor,click_url,image_data,mime_type,is_active,created_by) VALUES($1,$2,$3,$4,$5,$6,TRUE,$7) RETURNING id,slot_no,title,sponsor,click_url,created_at',[slotNo,title,sponsor||'प्रायोजित',clickUrl||null,image,mime,user.id]);
        await client.query('COMMIT');
        return json(res,201,{success:true,advertisement:q.rows[0]});
      } catch(e) {
        if(client)await client.query('ROLLBACK').catch(()=>{});
        console.error('Advertisement publish:',e.message);
        return json(res,e.message==='Too large'?413:400,{error:e.message==='Too large'?'इमेज बहुत बड़ी है। 2.5 MB से छोटी इमेज अपलोड करें।':'विज्ञापन सेव नहीं हो पाया।'});
      } finally {if(client)client.release();}
    }
    const deleteAd=pathname.match(/^\/api\/advertisements\/(\d+)$/);
    if(deleteAd && req.method==='DELETE') {
      const user=currentSession(req);
      if(!user || user.role!=='admin') return json(res,403,{error:'केवल Admin विज्ञापन हटा सकता है।'});
      try { await pool.query('DELETE FROM advertisements WHERE id=$1',[deleteAd[1]]); return json(res,200,{success:true}); }
      catch(e) { return json(res,500,{error:'विज्ञापन हटाया नहीं जा सका।'}); }
    }

    // ── API: Get Instagram Stories ──
    if (pathname === '/api/instagram-stories') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      if (fs.existsSync(INSTA_DATA_FILE)) {
        return fs.createReadStream(INSTA_DATA_FILE).pipe(res);
      } else {
        return res.end(JSON.stringify({ stories: [] }));
      }
    }

    // Protect all legacy story-publishing endpoints. GET is read-only verification only.
    if (pathname === '/api/add-insta-story') {
      const user = currentSession(req);
      if (!user || user.role !== 'admin') return json(res,403,{success:false,error:'केवल Admin स्टोरी जोड़ सकता है।'});
      if (req.method !== 'POST') return json(res,405,{success:false,error:'POST required'});
    }
    if (pathname === '/api/instagram-webhook' && req.method === 'POST') {
      const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i,'');
      const secret = process.env.WEBHOOK_SECRET || '';
      if (!secret || supplied.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(secret))) {
        return json(res,401,{success:false,error:'Webhook authentication required'});
      }
    }
    if (pathname === '/api/instagram-webhook' && req.method !== 'POST' && req.method !== 'GET' && req.method !== 'OPTIONS') return json(res,405,{error:'Method not allowed'});

    // ── API: Instagram Webhook (Meta Graph API / Zapier / Make.com / IFTTT) ──
    if (pathname === '/api/instagram-webhook' || pathname === '/api/add-insta-story') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });


      if (req.method === 'OPTIONS') {
        return res.end();
      }

      // Meta Webhook Verification (hub.challenge)
      if (req.method === 'GET') {
        const hubMode = parsedUrl.searchParams.get('hub.mode');
        const hubChallenge = parsedUrl.searchParams.get('hub.challenge');
        const expectedVerify=process.env.META_WEBHOOK_VERIFY_TOKEN;
        const suppliedVerify=parsedUrl.searchParams.get('hub.verify_token');
        if (hubMode === 'subscribe' && hubChallenge && expectedVerify && suppliedVerify===expectedVerify) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          console.log('✅ [Instagram Webhook] Meta Webhook verified with challenge:', hubChallenge);
          return res.end(hubChallenge);
        }
      }

      if (req.method === 'GET') return json(res,405,{success:false,error:'GET webhook publishing is disabled'});

      const handleAdd = (params) => {
        try {
          // Normalize payload from Meta Graph API, Zapier, Make.com, or direct form
          let title = '';
          let url = '';
          let image = '';
          let category = '📸 Instagram Reel';

          // 1. Meta Webhook payload check
          if (params.entry && Array.isArray(params.entry)) {
            for (const entry of params.entry) {
              const changes = entry.changes || [];
              for (const ch of changes) {
                const val = ch.value || {};
                title = val.caption || val.message || title;
                url = val.permalink || val.link || url;
                image = val.media_url || val.thumbnail_url || image;
                if (val.media_type === 'VIDEO') category = '📸 Instagram Reel';
                else if (val.media_type === 'IMAGE') category = '📷 Instagram Post';
              }
            }
          }

          // 2. Zapier / Make / Direct JSON fields
          title = title || params.caption || params.title || params.text || params.message || 'News 5 India Instagram ताज़ा स्टोरी';
          url = url || params.permalink || params.instaUrl || params.url || params.link || 'https://www.instagram.com/news5indiaa?dlrf=MXZ1ZHV0dTZhOW4xdw==';
          image = image || params.media_url || params.image || params.thumbnail_url || params.photo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=80';
          category = params.category || category;

          // Clean title if long
          title = title.split('\n')[0].trim();
          if (title.length > 90) title = title.slice(0, 87) + '...';

          let data = { lastUpdated: new Date().toISOString(), account: '@news5indiaa', stories: [] };
          if (fs.existsSync(INSTA_DATA_FILE)) {
            try { data = JSON.parse(fs.readFileSync(INSTA_DATA_FILE, 'utf-8')); } catch(e){}
          }
          if (!Array.isArray(data.stories)) data.stories = [];

          const newStory = {
            id: `insta-${Date.now()}`,
            title,
            image,
            category,
            instaUrl: url,
            date: 'अभी-अभी • Instagram Live',
            views: 'Just now',
            isInstagram: true
          };

          // Avoid duplicate post URL
          const exists = data.stories.find(s => s.instaUrl && s.instaUrl === url && s.title === title);
          if (!exists) {
            data.stories.unshift(newStory);
            // keep latest 20 stories
            if (data.stories.length > 20) data.stories = data.stories.slice(0, 20);
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(INSTA_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`📸 [Instagram Auto-Sync Webhook] New Post Auto-Published: "${title}"`);

            // ── Save to Neon PostgreSQL ──
            pool.query(`
              INSERT INTO instagram_stories (id, title, image, category, insta_url, date, views, is_instagram)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (id) DO NOTHING;
            `, [
              newStory.id, newStory.title, newStory.image, newStory.category,
              newStory.instaUrl, newStory.date, newStory.views, true
            ]).then(() => {
              console.log('💾 [Neon DB] Instagram story saved to PostgreSQL!');
            }).catch(e => console.error('⚠️ [Neon DB] Story save warning:', e.message));
          }

          res.end(JSON.stringify({ success: true, story: newStory, total: data.stories.length }));
        } catch(err) {
          console.error('Error handling insta webhook:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      };

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const params = JSON.parse(body);
            handleAdd(params);
          } catch(e) {
            handleAdd(Object.fromEntries(new URLSearchParams(body)));
          }
        });
        return;
      } else {
        const params = Object.fromEntries(parsedUrl.searchParams);
        return handleAdd(params);
      }
    }

    let reqPath = decodeURI(pathname);
    if (reqPath === '/') reqPath = '/index.html';

    const filePath = path.join(ROOT, reqPath);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Access Denied');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });

      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${portToTry} busy. Trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(portToTry, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 News5Indiaa Server is LIVE & ACTIVE!`);
    console.log(`👉 Browser me kholein: http://localhost:${portToTry}`);
    console.log(`✨ 24x7 Real News Engine: ${FEED_CONFIG.length} feeds, every 5 minutes`);
    console.log(`📰 Categories: देश, विश्व, राज्य, मनोरंजन/OTT, खेल, बिज़नेस, टेक, राजनीति`);
    console.log(`🏙️ States: UP, Delhi NCR, Bihar, MP, Rajasthan`);
    console.log(`======================================================\n`);
  });
}

startServer(PORT);

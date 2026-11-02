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
  { query: 'Indian television serials daily soaps reality shows TV show latest updates', category: 'टीवी शो और सीरियल', slug: 'tv', author: 'News5Indiaa TV डेस्क', maxItems: 3 },
  { query: 'streaming series season finale cast release date Netflix Prime Video JioHotstar India', category: 'वेब सीरीज़ और OTT', slug: 'ott', author: 'News5Indiaa OTT डेस्क', maxItems: 3 },
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
  { query: 'India crime news police investigation court latest', category: 'अपराध', slug: 'crime', author: 'News5Indiaa क्राइम डेस्क', maxItems: 3 },
  { query: 'India religion temple pilgrimage festival news', category: 'धर्म और आस्था', slug: 'religion', author: 'News5Indiaa धर्म डेस्क', maxItems: 2 },
  { query: 'India lifestyle fashion food travel culture news', category: 'लाइफस्टाइल', slug: 'lifestyle', author: 'News5Indiaa लाइफस्टाइल डेस्क', maxItems: 2 },
  { query: 'India legal news Supreme Court High Court latest', category: 'कानून और कोर्ट', slug: 'law', author: 'News5Indiaa लीगल डेस्क', maxItems: 2 },
  { query: 'India defence military army navy air force news', category: 'डिफेंस', slug: 'defense', author: 'News5Indiaa डिफेंस डेस्क', maxItems: 2 },
  { query: 'India fact check misinformation verification news', category: 'फैक्ट चेक', slug: 'factcheck', author: 'News5Indiaa फैक्ट चेक डेस्क', maxItems: 2 },
  { query: 'India personal finance tax banking insurance news', category: 'पर्सनल फाइनेंस', slug: 'finance', author: 'News5Indiaa फाइनेंस डेस्क', maxItems: 2 },
  { query: 'India gold silver price market update today', category: 'सोना-चांदी और बाजार', slug: 'markets', author: 'News5Indiaa मार्केट डेस्क', maxItems: 2 },
  { query: 'India travel tourism destinations railways aviation news', category: 'यात्रा और पर्यटन', slug: 'travel', author: 'News5Indiaa ट्रैवल डेस्क', maxItems: 2 },
  { query: 'India viral stories internet social media trends', category: 'वायरल और ट्रेंडिंग', slug: 'trending', author: 'News5Indiaa ट्रेंडिंग डेस्क', maxItems: 2 },
  { query: 'India rural development village civic infrastructure news', category: 'ग्राउंड रिपोर्ट', slug: 'ground', author: 'News5Indiaa ग्राउंड रिपोर्ट डेस्क', maxItems: 2 },
  { query: 'India women issues women achievement safety news', category: 'महिला जगत', slug: 'women', author: 'News5Indiaa महिला डेस्क', maxItems: 2 },
  { query: 'India employment career skill development campus news', category: 'करियर', slug: 'career', author: 'News5Indiaa करियर डेस्क', maxItems: 2 },
  { query: 'India election commission parliament government policy news', category: 'सरकार और नीति', slug: 'governance', author: 'News5Indiaa पॉलिसी डेस्क', maxItems: 2 },
  { query: 'Uttar Pradesh crime police court latest news', category: 'यूपी क्राइम', slug: 'crime', state: 'up', stateName: 'उत्तर प्रदेश', author: 'News5Indiaa यूपी क्राइम ब्यूरो', maxItems: 2 },
  { query: 'Mathura Vrindavan local news administration police', category: 'मथुरा-वृंदावन', slug: 'state', state: 'up', stateName: 'मथुरा-वृंदावन', author: 'News5Indiaa मथुरा ब्यूरो', maxItems: 3 },
  { query: 'Agra local news administration police Uttar Pradesh', category: 'आगरा', slug: 'state', state: 'up', stateName: 'आगरा', author: 'News5Indiaa आगरा ब्यूरो', maxItems: 2 },
  { query: 'Maharashtra Mumbai Pune Nagpur Nashik latest news government police civic', category: 'राज्य', slug: 'state', state: 'maharashtra', stateName: 'महाराष्ट्र', author: 'News5Indiaa महाराष्ट्र ब्यूरो', maxItems: 2 },
  { query: 'Punjab Chandigarh Ludhiana Amritsar latest news government police civic', category: 'राज्य', slug: 'state', state: 'punjab', stateName: 'पंजाब', author: 'News5Indiaa पंजाब ब्यूरो', maxItems: 2 },
  { query: 'Haryana Gurugram Faridabad Hisar latest news government police civic', category: 'राज्य', slug: 'state', state: 'haryana', stateName: 'हरियाणा', author: 'News5Indiaa हरियाणा ब्यूरो', maxItems: 2 },
  { query: 'Uttarakhand Dehradun Haridwar Haldwani latest news government police civic', category: 'राज्य', slug: 'state', state: 'uttarakhand', stateName: 'उत्तराखंड', author: 'News5Indiaa उत्तराखंड ब्यूरो', maxItems: 2 },
  { query: 'West Bengal Kolkata Siliguri latest news government police civic', category: 'राज्य', slug: 'state', state: 'westbengal', stateName: 'पश्चिम बंगाल', author: 'News5Indiaa पश्चिम बंगाल ब्यूरो', maxItems: 2 },
  { query: 'Gujarat Ahmedabad Surat Vadodara latest news government police civic', category: 'राज्य', slug: 'state', state: 'gujarat', stateName: 'गुजरात', author: 'News5Indiaa गुजरात ब्यूरो', maxItems: 2 },
  { query: 'Jammu Kashmir Srinagar Jammu latest news government police civic', category: 'राज्य', slug: 'state', state: 'jk', stateName: 'जम्मू-कश्मीर', author: 'News5Indiaa जम्मू-कश्मीर ब्यूरो', maxItems: 2 },
  { query: 'Chhattisgarh Raipur Bilaspur latest news government police civic', category: 'राज्य', slug: 'state', state: 'chhattisgarh', stateName: 'छत्तीसगढ़', author: 'News5Indiaa छत्तीसगढ़ ब्यूरो', maxItems: 2 },
  { query: 'Jharkhand Ranchi Jamshedpur Dhanbad latest news government police civic', category: 'राज्य', slug: 'state', state: 'jharkhand', stateName: 'झारखंड', author: 'News5Indiaa झारखंड ब्यूरो', maxItems: 2 },
  { query: 'Odisha Bhubaneswar Cuttack latest news government police civic', category: 'राज्य', slug: 'state', state: 'odisha', stateName: 'ओडिशा', author: 'News5Indiaa ओडिशा ब्यूरो', maxItems: 2 },
  { query: 'Telangana Hyderabad Warangal latest news government police civic', category: 'राज्य', slug: 'state', state: 'telangana', stateName: 'तेलंगाना', author: 'News5Indiaa तेलंगाना ब्यूरो', maxItems: 2 },
  { query: 'Karnataka Bengaluru Mysuru Mangaluru latest news government police civic', category: 'राज्य', slug: 'state', state: 'karnataka', stateName: 'कर्नाटक', author: 'News5Indiaa कर्नाटक ब्यूरो', maxItems: 2 },
  { query: 'Kerala Thiruvananthapuram Kochi Kozhikode latest news government police civic', category: 'राज्य', slug: 'state', state: 'kerala', stateName: 'केरल', author: 'News5Indiaa केरल ब्यूरो', maxItems: 2 },
  { query: 'Tamil Nadu Chennai Coimbatore Madurai latest news government police civic', category: 'राज्य', slug: 'state', state: 'tamilnadu', stateName: 'तमिलनाडु', author: 'News5Indiaa तमिलनाडु ब्यूरो', maxItems: 2 },
  { query: 'Andhra Pradesh Amaravati Visakhapatnam Vijayawada latest news government police civic', category: 'राज्य', slug: 'state', state: 'andhra', stateName: 'आंध्र प्रदेश', author: 'News5Indiaa आंध्र प्रदेश ब्यूरो', maxItems: 2 },
  { query: 'Assam Guwahati Northeast India latest news government police civic', category: 'राज्य', slug: 'state', state: 'assam', stateName: 'असम और पूर्वोत्तर', author: 'News5Indiaa असम और पूर्वोत्तर ब्यूरो', maxItems: 2 }
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

const publisherImageCache = new Map();

async function getPublisherImage(articleUrl) {
  if (!articleUrl || !/^https:\/\//i.test(articleUrl)) return '';
  if (publisherImageCache.has(articleUrl)) return publisherImageCache.get(articleUrl);
  try {
    const html = await fetchRaw(articleUrl);
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i
    ];
    let image = '';
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) { image = cleanHtmlEntities(match[1].trim()); break; }
    }
    if (image.startsWith('//')) image = 'https:' + image;
    if (!/^https:\/\//i.test(image) || /\.(?:svg|gif)(?:[?#]|$)/i.test(image)) image = '';
    publisherImageCache.set(articleUrl, image);
    if (publisherImageCache.size > 600) publisherImageCache.delete(publisherImageCache.keys().next().value);
    return image;
  } catch {
    publisherImageCache.set(articleUrl, '');
    return '';
  }
}

async function enrichPublisherImages(articles, maxItems = 24, concurrency = 4) {
  const targets = articles.filter(item => item.articleUrl && (item.imageSource === 'fallback' || !item.image || !/^https:\/\//i.test(item.image))).slice(0, maxItems);
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrency, targets.length)}, async () => {
    while (cursor < targets.length) {
      const item = targets[cursor++];
      const image = await getPublisherImage(item.articleUrl);
      if (image) { item.image = image; item.imageSource = 'publisher'; }
    }
  });
  await Promise.all(workers);
}

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 9000);
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
  "bollywood hungama", "pinkvilla", "filmibeat", "koimoi", "tellychakkar", "india forums", "bollywood life", "variety", "deadline", "people", "cnn", "the guardian", "al jazeera", "sky news", "nbc news", "cbs news", "abc news", "the washington post", "new york times", "forbes", "techcrunch", "the verge", "wired", "the associated press",
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
  return age >= -60 * 60 * 1000 && age <= 24 * 60 * 60 * 1000;
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
    const imageMatch = itemXml.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*url=["']([^"']+)["'][^>]*>/i)
      || itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);

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
        articleUrl: linkMatch ? cleanHtmlEntities(linkMatch[1].trim()) : '',
        imageUrl: imageMatch && /^https:\/\//i.test(imageMatch[1]) ? cleanHtmlEntities(imageMatch[1]) : ''
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
  'राजनीति':'Politics', 'फिल्में':'Movies', 'वेब सीरीज़ और OTT':'Web Series & OTT', 'टीवी शो और सीरियल':'TV Shows & Serials',
  'ट्रेलर और टीज़र':'Trailers & Teasers', 'बॉक्स ऑफिस':'Box Office',
  'टीवी और सेलिब्रिटी':'TV & Celebrities', 'AI और टेक्नोलॉजी':'AI & Technology',
  'मोबाइल और गैजेट्स':'Mobiles & Gadgets', 'साइबर और डिजिटल':'Cyber & Digital',
  'गेमिंग और ई-स्पोर्ट्स':'Gaming & Esports', 'ऑटो और EV':'Auto & EV',
  'विज्ञान और अंतरिक्ष':'Science & Space', 'शिक्षा और परीक्षा':'Education',
  'सरकारी नौकरी और भर्ती':'Government Jobs', 'स्टार्टअप और अर्थव्यवस्था':'Startups & Economy',
  'स्वास्थ्य समाचार':'Health', 'मौसम और मानसून':'Weather', 'कृषि और किसान':'Agriculture',
  'पर्यावरण':'Environment', 'अपराध':'Crime', 'धर्म और आस्था':'Religion & Faith', 'लाइफस्टाइल':'Lifestyle',
  'कानून और कोर्ट':'Law & Courts', 'डिफेंस':'Defence', 'फैक्ट चेक':'Fact Check',
  'पर्सनल फाइनेंस':'Personal Finance', 'सोना-चांदी और बाजार':'Gold, Silver & Markets',
  'यात्रा और पर्यटन':'Travel & Tourism', 'वायरल और ट्रेंडिंग':'Viral & Trending',
  'ग्राउंड रिपोर्ट':'Ground Reports', 'महिला जगत':'Women', 'करियर':'Careers',
  'सरकार और नीति':'Government & Policy', 'यूपी क्राइम':'Uttar Pradesh Crime',
  'मथुरा-वृंदावन':'Mathura-Vrindavan', 'आगरा':'Agra'
};

function feedsForLanguage(language) {
  if (language !== 'en') return FEED_CONFIG;
  return FEED_CONFIG.map(feed => ({
    ...feed,
    url: feed.url.replace(/hl=hi/g, 'hl=en-IN').replace(/ceid=IN:hi/g, 'ceid=IN:en'),
    category: ENGLISH_CATEGORY_NAMES[feed.category] || feed.category,
    stateName: ({
      'उत्तर प्रदेश':'Uttar Pradesh','दिल्ली NCR':'Delhi NCR','महाराष्ट्र':'Maharashtra',
      'पंजाब':'Punjab','हरियाणा':'Haryana','उत्तराखंड':'Uttarakhand','पश्चिम बंगाल':'West Bengal',
      'गुजरात':'Gujarat','जम्मू-कश्मीर':'Jammu & Kashmir','छत्तीसगढ़':'Chhattisgarh',
      'झारखंड':'Jharkhand','ओडिशा':'Odisha','तेलंगाना':'Telangana','कर्नाटक':'Karnataka',
      'केरल':'Kerala','तमिलनाडु':'Tamil Nadu','आंध्र प्रदेश':'Andhra Pradesh','असम और पूर्वोत्तर':'Assam & Northeast'
    })[feed.stateName] || feed.stateName,
    author: 'News5India News Desk'
  }));
}

let updateCycle = 0;
const newsRefreshInFlight = new Set();
function autoUpdateAllNews(language = 'hi') {
  if (newsRefreshInFlight.has(language)) {
    console.log(`⏳ [News Engine] ${language} refresh already running; skipping overlapping cycle.`);
    return Promise.resolve();
  }
  newsRefreshInFlight.add(language);
  return runNewsUpdate(language)
    .catch(err => console.error(`❌ [News Engine] ${language} refresh failed:`, err.message))
    .finally(() => newsRefreshInFlight.delete(language));
}
async function runNewsUpdate(language = 'hi') {
  updateCycle++;
  const allArticles = [];
  const seenTitles = new Set();
  const usedFallbackImages = new Set();
  const ts = Date.now();

  const activeFeeds = feedsForLanguage(language);
  const targetDataFile = language === 'en' ? EN_DATA_FILE : DATA_FILE;
  console.log(`\n🔄 [Cycle #${updateCycle}] Fetching ${language.toUpperCase()} news from ${activeFeeds.length} feeds...`);

  // Fetch feeds in small parallel batches so language refreshes finish promptly.
  for (let batchStart = 0; batchStart < activeFeeds.length; batchStart += 10) {
    const batch = activeFeeds.slice(batchStart, batchStart + 10);
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
          image: item.imageUrl && /^https:\/\//i.test(item.imageUrl) ? item.imageUrl : '',
          imageSource: item.imageUrl && /^https:\/\//i.test(item.imageUrl) ? 'rss' : 'fallback',
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
    await enrichPublisherImages(allArticles, 36, 5);
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
    // Keep a recent last-good edition during a temporary RSS outage, but never serve
    // headlines older than 24 hours as if they were today's news.
    let previous = null;
    try { if (fs.existsSync(targetDataFile)) previous = JSON.parse(fs.readFileSync(targetDataFile, 'utf-8')); } catch {}
    const previousAge = previous && Date.parse(previous.lastUpdated || '') ? Date.now() - Date.parse(previous.lastUpdated) : Infinity;
    if (previous && Array.isArray(previous.articles) && previous.articles.length && previousAge >= 0 && previousAge <= 24 * 60 * 60 * 1000) {
      console.log(`⚠️ [Cycle #${updateCycle}] RSS returned no fresh headlines; keeping last-good edition (${Math.round(previousAge / 60000)} min old).\n`);
    } else {
      const emptyPayload = { lastUpdated: new Date().toISOString(), totalArticles: 0, articles: [], refreshStatus: 'no-fresh-news' };
      fs.writeFileSync(targetDataFile, JSON.stringify(emptyPayload, null, 2), 'utf-8');
      console.log(`⚠️ [Cycle #${updateCycle}] No trusted headlines in the last 24 hours; stale headlines cleared.\n`);
    }
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
const startupReady = initDB().then(async ready => { if (!ready) return false; await initAdmin(); return true; }).catch(e => { console.error('Database/admin initialization failed:', e.message); return false; });
async function authRoute(req,res,path){
  // Do not authenticate until DB schema and the admin password hash are initialized.
  if (!(await startupReady)) return json(res,503,{error:'सर्वर का डेटाबेस तैयार नहीं है। Render में DATABASE_URL जांचें और कुछ देर बाद दोबारा कोशिश करें।'});
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


function escapeEpaperHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
}

function buildEpaperHtml(language = 'hi') {
  const file = language === 'en' ? EN_DATA_FILE : DATA_FILE;
  let payload = { articles: [], lastUpdated: null };
  try {
    if (fs.existsSync(file)) payload = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error('[E-Paper] Could not read news edition:', err.message);
  }
  const now = new Date();
  const today = new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : 'hi-IN', {
    day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Kolkata'
  }).format(now);
  const dateSlug = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Asia/Kolkata', year:'numeric', month:'2-digit', day:'2-digit'
  }).format(now);
  const isFresh = payload.lastUpdated && Date.now() - Date.parse(payload.lastUpdated) <= 24 * 60 * 60 * 1000;
  const articles = isFresh && Array.isArray(payload.articles) ? payload.articles.slice(0, 30) : [];
  const text = language === 'en';
  const title = text ? 'NEWS 5 INDIA — Daily E-Paper' : 'NEWS 5 INDIA — दैनिक ई-पेपर';
  const esc = escapeEpaperHtml;
  const lead = articles[0];
  const groups = new Map();
  for (const item of articles.slice(1)) {
    const category = item.category || (text ? 'News' : 'समाचार');
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(item);
  }
  const articleCard = (item, index, featured = false) => {
    const image = item.image && /^https:\/\//i.test(item.image)
      ? '<img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" class="story-image" loading="lazy">'
      : '<div class="story-image-placeholder">' + esc(item.category || (text ? 'NEWS' : 'समाचार')) + '</div>';
    const source = item.source ? '<span class="source">' + esc(item.source) + '</span>' : '';
    const excerpt = item.excerpt && item.excerpt !== item.title ? item.excerpt : '';
    const link = item.articleUrl && /^https:\/\//i.test(item.articleUrl)
      ? '<a class="source-link" href="' + esc(item.articleUrl) + '">' + (text ? 'Read source report' : 'मूल खबर पढ़ें') + ' ↗</a>'
      : '';
    return '<article class="story ' + (featured ? 'featured' : '') + '">' +
      image +
      '<div class="story-kicker">' + esc(item.category || '') + (item.stateName ? ' · ' + esc(item.stateName) : '') + '</div>' +
      '<h2>' + esc(item.title) + '</h2>' +
      (excerpt ? '<p>' + esc(excerpt) + '</p>' : '') +
      '<div class="story-meta">' + source + '<span>' + esc(item.date || '') + '</span></div>' + link +
      '</article>';
  };
  const sections = Array.from(groups.entries()).map(([category, items]) =>
    '<section class="desk"><h2 class="desk-title">' + esc(category) + '</h2><div class="desk-grid">' +
    items.map((item, index) => articleCard(item, index)).join('') + '</div></section>'
  ).join('');
  const noNews = '<div class="no-news">' + (text
    ? 'No verified fresh headlines are available for this edition yet. Please check again after the next news update.'
    : 'इस समय सत्यापित ताज़ा खबरें उपलब्ध नहीं हैं। अगली न्यूज़ अपडेट के बाद दोबारा देखें।') + '</div>';
  return '<!doctype html><html lang="' + (text ? 'en' : 'hi') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' — ' + dateSlug + '</title><style>' +
  '*{box-sizing:border-box}body{margin:0;background:#e9edf2;color:#171717;font-family:Georgia,"Noto Serif Devanagari","Nirmala UI",serif}.toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:center;gap:12px;padding:12px;background:#171d29}.toolbar button{border:0;border-radius:6px;padding:11px 18px;font:700 14px Arial,sans-serif;cursor:pointer}.print{background:#c8102e;color:white}.back{background:#fff;color:#171d29}.paper{width:min(1100px,calc(100% - 28px));margin:22px auto;background:#fff;padding:32px 38px;box-shadow:0 8px 35px #18202d18}.masthead{text-align:center;border-bottom:4px double #171717;padding-bottom:15px}.brand{display:flex;align-items:center;justify-content:center;gap:12px;font:900 42px Arial,sans-serif;letter-spacing:1px;color:#bd1424}.paper-logo{width:58px;height:58px;object-fit:contain}.story-image-placeholder{height:110px;display:flex;align-items:center;justify-content:center;background:#eef1f5;color:#667085;font:700 12px Arial,sans-serif;letter-spacing:1px;border:1px solid #dfe3e9}.tagline{font:700 12px Arial,sans-serif;letter-spacing:2px;margin-top:5px}.edition{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #222;border-bottom:1px solid #222;padding:8px 0;margin-top:14px;font:700 12px Arial,sans-serif}.front-label{text-align:center;font:900 12px Arial,sans-serif;letter-spacing:2px;color:#bd1424;margin:18px 0 10px}.lead{display:grid;grid-template-columns:1.05fr .95fr;gap:22px;padding-bottom:18px;border-bottom:3px solid #171717}.lead .story-image{width:100%;height:265px;object-fit:cover}.story-kicker{font:800 11px Arial,sans-serif;color:#bd1424;text-transform:uppercase;margin:5px 0}.story h2{font-size:20px;line-height:1.28;margin:5px 0 8px}.lead h2{font-size:30px;line-height:1.16}.story p{font-size:13px;line-height:1.55;margin:6px 0}.story-meta{display:flex;justify-content:space-between;gap:8px;font:11px Arial,sans-serif;color:#666;margin-top:9px}.source{font-weight:700}.source-link{display:inline-block;margin-top:8px;font:700 11px Arial,sans-serif;color:#bd1424;text-decoration:none}.desk{margin-top:20px;break-inside:avoid}.desk-title{font:900 18px Arial,sans-serif;border-bottom:2px solid #bd1424;padding:0 0 7px;margin:0 0 12px}.desk-grid{columns:3;column-gap:22px}.desk .story{display:inline-block;width:100%;break-inside:avoid;border-bottom:1px solid #bbb;padding:0 0 12px;margin:0 0 12px}.desk .story .story-image{width:100%;height:110px;object-fit:cover;margin:0 0 7px}.desk .story h2{font-size:16px}.desk .story p{font-size:12px}.no-news{padding:45px 20px;text-align:center;border:1px dashed #aaa;font:16px Arial,sans-serif;margin-top:20px}.footer{text-align:center;border-top:3px double #171717;padding-top:10px;margin-top:25px;font:11px Arial,sans-serif;color:#555}.notice{text-align:center;font:11px Arial,sans-serif;color:#666;margin:12px 0}.toolbar-note{color:#fff;font:12px Arial,sans-serif;align-self:center}@page{size:A3 portrait;margin:12mm}@media print{body{background:#fff}.toolbar{display:none}.paper{width:100%;margin:0;padding:0;box-shadow:none}.lead,.desk,.story{break-inside:avoid}.desk-grid{columns:3}.source-link{color:#333;text-decoration:underline}a{color:#111}}@media(max-width:700px){.paper{width:100%;margin:0;padding:18px}.brand{font-size:31px}.lead{grid-template-columns:1fr}.lead h2{font-size:25px}.lead .story-image{height:210px}.paper-logo{width:46px;height:46px}.desk-grid{columns:2}.edition{font-size:10px}}' +
  '</style></head><body><div class="toolbar"><button class="print" onclick="window.print()">⬇ ' + (text ? 'Download / Print PDF' : 'PDF डाउनलोड / प्रिंट करें') + '</button><button class="back" onclick="history.back()">' + (text ? 'Back to website' : 'वेबसाइट पर वापस जाएं') + '</button><span class="toolbar-note">' + (text ? 'Choose “Save as PDF” in the print window' : 'प्रिंट विंडो में “Save as PDF” चुनें') + '</span></div><main class="paper"><header class="masthead"><div class="brand"><img class="paper-logo" src="/assets/logo-badge.jpg" alt="News5India logo">NEWS 5 INDIA</div><div class="tagline">' + (text ? 'EVERY STORY. EVERY SIDE.' : 'हर खबर, आपके साथ') + '</div><div class="edition"><span>' + (text ? 'DAILY NATIONAL EDITION' : 'दैनिक राष्ट्रीय संस्करण') + '</span><span>' + esc(today) + '</span><span>' + (text ? 'PRICE ₹5' : 'मूल्य ₹5') + '</span></div></header>' +
  (articles.length ? '<div class="front-label">' + (text ? 'TODAY’S TOP STORY' : 'आज की सबसे बड़ी खबर') + '</div><section class="lead">' + articleCard(lead,0,true) + (articles[1] ? articleCard(articles[1],1) : '') + '</section>' + sections : noNews) +
  '<div class="notice">' + (text ? 'Headlines and summaries are based on the linked publisher reports. Read original sources for full coverage.' : 'समाचारों के शीर्षक और संक्षेप संबंधित प्रकाशकों की रिपोर्ट पर आधारित हैं। विस्तृत जानकारी के लिए मूल स्रोत पढ़ें।') + '</div><footer class="footer">NEWS 5 INDIA MEDIA NETWORK · ' + esc(today) + ' · ' + (articles.length ? articles.length : 0) + ' ' + (text ? 'verified headlines' : 'सत्यापित सुर्खियां') + '</footer></main></body></html>';
}

function startServer(portToTry) {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (pathname === '/epaper' && req.method === 'GET') {
      const language = parsedUrl.searchParams.get('lang') === 'en' ? 'en' : 'hi';
      const documentHtml = buildEpaperHtml(language);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(documentHtml);
    }
    if (pathname === '/api/search' && req.method === 'GET') {
      const query = String(parsedUrl.searchParams.get('q') || '').trim().slice(0, 120);
      if (query.length < 2) return json(res, 400, { error: 'कम से कम 2 अक्षर लिखें।', articles: [] });
      try {
        const encoded = encodeURIComponent(query);
        const urls = [
          'https://news.google.com/rss/search?q=' + encoded + '&hl=hi&gl=IN&ceid=IN:hi',
          'https://news.google.com/rss/search?q=' + encoded + '&hl=en-IN&gl=IN&ceid=IN:en',
          'https://news.google.com/rss/search?q=' + encoded + '&hl=en-US&gl=US&ceid=US:en'
        ];
        const feeds = await Promise.all(urls.map(async url => {
          try { return parseXmlItems(await fetchRaw(url), 30); } catch (err) {
            console.warn('[Search] Feed unavailable:', err.message);
            return [];
          }
        }));
        const seen = new Set();
        const articles = [];
        for (const item of feeds.flat()) {
          const key = String(item.title || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, '').slice(0, 90);
          const published = Date.parse(item.pubDate || '');
          const age = Date.now() - published;
          if (!item.title || !key || seen.has(key) || !isTrustedPublisher(item.source) ||
              !/^https:\/\//i.test(item.articleUrl) || !Number.isFinite(published) ||
              age < -60 * 60 * 1000 || age > 30 * 24 * 60 * 60 * 1000 ||
              requiresEditorialReview(item)) continue;
          seen.add(key);
          const excerpt = item.description && item.description.length > 10 ? item.description : item.title;
          articles.push({
            id: 'search-' + Buffer.from(key).toString('base64url').slice(0, 32),
            title: item.title,
            excerpt,
            category: 'Search Results / खोज परिणाम',
            categorySlug: 'search',
            author: 'News5India Search Desk',
            date: formatHindiTime(item.pubDate),
            publishedAt: item.pubDate,
            source: item.source,
            articleUrl: item.articleUrl,
            readTime: '2 मिनट',
            image: item.imageUrl && /^https:\/\//i.test(item.imageUrl) ? item.imageUrl : '',
            imageSource: item.imageUrl ? 'rss' : 'fallback',
            views: '—',
            content: '<p><strong>स्रोत:</strong> ' + escapeEpaperHtml(item.source || 'News publisher') + '</p><p>' + escapeEpaperHtml(excerpt) + '</p><p>यह खोज परिणाम प्रकाशक की उपलब्ध रिपोर्ट पर आधारित है। पूरी जानकारी के लिए मूल खबर खोलें।</p>'
          });
        }
        articles.sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
        await enrichPublisherImages(articles, 30, 5);
        return json(res, 200, { query, totalArticles: articles.length, articles });
      } catch (err) {
        console.error('[Search] Failed:', err.message);
        return json(res, 502, { error: 'अभी खोज उपलब्ध नहीं है। थोड़ी देर बाद कोशिश करें।', articles: [] });
      }
    }
    if (pathname === '/api/news' && req.method === 'GET') {
      const language = parsedUrl.searchParams.get('lang') === 'en' ? 'en' : 'hi';
      const newsFile = language === 'en' ? EN_DATA_FILE : DATA_FILE;
      try {
        if (!fs.existsSync(newsFile)) return json(res,503,{error:'समाचार अपडेट तैयार हो रहा है।',articles:[]});
        const payload = JSON.parse(fs.readFileSync(newsFile,'utf-8'));
        const updatedAt = Date.parse(payload.lastUpdated || '');
        if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > 24 * 60 * 60 * 1000) {
          return json(res,200,{lastUpdated:payload.lastUpdated || null,totalArticles:0,articles:[],refreshStatus:'stale-cleared'});
        }
        return json(res,200,payload);
      } catch(e) {
        console.error('[News API] Read failed:',e.message);
        return json(res,503,{error:'समाचार अभी उपलब्ध नहीं हैं।',articles:[]});
      }
    }
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
    console.log(`📰 Coverage: National, World, Politics, Crime, Sports, Movies, OTT, TV Shows, Business, Tech, Education, Jobs, Health, Auto, Agriculture and more`);
    console.log(`🏙️ Editions: Uttar Pradesh, Delhi NCR, Bihar, MP, Rajasthan and 16 additional state editions`);
    console.log(`======================================================\n`);
  });
}

startServer(PORT);

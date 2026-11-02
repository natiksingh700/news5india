/**
 * News5Indiaa - Main Application Logic
 * Mobile-first Hindi News Portal (Modeled after Dainik Jagran style)
 * Clean, fast, responsive with silent automated background updates
 */

document.addEventListener("DOMContentLoaded", () => {
  // App State
  const state = {
    currentCategory: "all",
    currentLanguage: localStorage.getItem("news5_language") || "hi",
    currentState: "all",
    searchQuery: "",
    tickerIndex: 0,
    isTickerPlaying: true,
    tickerInterval: null,
    fontSizeDelta: 0,
    currentArticle: null,
    isSpeaking: false,
    speechUtterance: null,
  };

  // DOM Elements Cache
  const elements = {
    // Top Bar & Controls
    liveDate: document.getElementById("liveDate"),
    editionSelect: document.getElementById("editionSelect"),
    btnFontDec: document.getElementById("btnFontDec"),
    btnFontInc: document.getElementById("btnFontInc"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    themeIcon: document.getElementById("themeIcon"),
    btnTopLiveTv: document.getElementById("btnTopLiveTv"),
    btnHeaderLiveTv: document.getElementById("btnHeaderLiveTv"),
    homeLogoLink: document.getElementById("homeLogoLink"),
    newsLanguageSelect: document.getElementById("newsLanguageSelect"),

    // Header & Search
    hamburgerBtn: document.getElementById("hamburgerBtn"),
    searchTriggerBtn: document.getElementById("searchTriggerBtn"),
    searchOverlay: document.getElementById("searchOverlay"),
    globalSearchInput: document.getElementById("globalSearchInput"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    closeSearchBtn: document.getElementById("closeSearchBtn"),
    searchSuggestions: document.getElementById("searchSuggestions"),
    epaperBtn: document.getElementById("epaperBtn"),

    // Nav
    categoryNav: document.getElementById("categoryNav"),

    // Ticker
    tickerSlider: document.getElementById("tickerSlider"),
    tickerPrevBtn: document.getElementById("tickerPrevBtn"),
    tickerNextBtn: document.getElementById("tickerNextBtn"),
    tickerPlayPauseBtn: document.getElementById("tickerPlayPauseBtn"),

    // Cricket Strip
    cricketStrip: document.getElementById("cricketStrip"),
    cricketTournament: document.getElementById("cricketTournament"),
    cricketStatus: document.getElementById("cricketStatus"),
    team1Score: document.getElementById("team1Score"),
    team2Score: document.getElementById("team2Score"),
    cricketNote: document.getElementById("cricketNote"),

    // Feed & Layout
    filterHeader: document.getElementById("filterHeader"),
    filterTitle: document.getElementById("filterTitle"),
    clearFilterBtn: document.getElementById("clearFilterBtn"),
    leadStoryContainer: document.getElementById("leadStoryContainer"),
    stateChips: document.getElementById("stateChips"),
    newsCardsGrid: document.getElementById("newsCardsGrid"),
    categoryShelves: document.getElementById("categoryShelves"),
    webStoriesTrack: document.getElementById("webStoriesTrack"),
    videoGrid: document.getElementById("videoGrid"),
    trendingList: document.getElementById("trendingList"),

    // Drawer
    mobileDrawer: document.getElementById("mobileDrawer"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
    closeDrawerBtn: document.getElementById("closeDrawerBtn"),

    // Article Modal
    articleModalBackdrop: document.getElementById("articleModalBackdrop"),
    closeArticleModalBtn: document.getElementById("closeArticleModalBtn"),
    modalCategory: document.getElementById("modalCategory"),
    modalDate: document.getElementById("modalDate"),
    modalArticleTitle: document.getElementById("modalArticleTitle"),
    modalAuthor: document.getElementById("modalAuthor"),
    modalReadTime: document.getElementById("modalReadTime"),
    modalImage: document.getElementById("modalImage"),
    modalCaption: document.getElementById("modalCaption"),
    modalBulletsWrap: document.getElementById("modalBulletsWrap"),
    modalBulletsList: document.getElementById("modalBulletsList"),
    modalArticleContent: document.getElementById("modalArticleContent"),
    ttsPlayBtn: document.getElementById("ttsPlayBtn"),
    ttsIcon: document.getElementById("ttsIcon"),
    ttsLabel: document.getElementById("ttsLabel"),
    modalFontDec: document.getElementById("modalFontDec"),
    modalFontInc: document.getElementById("modalFontInc"),
    modalWaShare: document.getElementById("modalWaShare"),
    modalXShare: document.getElementById("modalXShare"),
    modalCopyShare: document.getElementById("modalCopyShare"),
    commenterName: document.getElementById("commenterName"),
    commenterText: document.getElementById("commenterText"),
    submitCommentBtn: document.getElementById("submitCommentBtn"),
    modalCommentsList: document.getElementById("modalCommentsList"),

    // Live TV Modal
    liveTvModalBackdrop: document.getElementById("liveTvModalBackdrop"),
    closeLiveTvBtn: document.getElementById("closeLiveTvBtn"),
    liveTvSidebarTrigger: document.getElementById("liveTvSidebarTrigger"),
    tvTimeCode: document.getElementById("tvTimeCode"),
    tvMuteToggleBtn: document.getElementById("tvMuteToggleBtn"),

    // E-paper Modal
    epaperModalBackdrop: document.getElementById("epaperModalBackdrop"),
    closeEpaperBtn: document.getElementById("closeEpaperBtn"),
    openEpaperModalBtn: document.getElementById("openEpaperModalBtn"),
    footerEpaperLink: document.getElementById("footerEpaperLink"),
    footerLiveTvLink: document.getElementById("footerLiveTvLink"),

    // Poll
    pollOptions: document.getElementById("pollOptions"),
    pollResult: document.getElementById("pollResult"),
    waJoinBtn: document.getElementById("waJoinBtn"),

    // Toast
    toastNotification: document.getElementById("toastNotification"),
  };

  /* ==========================================================================
     1. Initialization
     ========================================================================== */
  function init() {
    try { initTheme(); } catch (e) { console.error("initTheme error:", e); }
    try { updateLiveDate(); } catch (e) { console.error("updateLiveDate error:", e); }
    try { renderCricketWidget(); } catch (e) { console.error("renderCricketWidget error:", e); }
    try { renderLeadStory(); } catch (e) { console.error("renderLeadStory error:", e); }
    try { renderNewsFeed(); } catch (e) { console.error("renderNewsFeed error:", e); }
    try { renderTicker(); } catch (e) { console.error("renderTicker error:", e); }
    try { renderWebStories(); } catch (e) { console.error("renderWebStories error:", e); }
    try { renderVideos(); } catch (e) { console.error("renderVideos error:", e); }
    try { renderTrending(); } catch (e) { console.error("renderTrending error:", e); }
    try { initEventListeners(); } catch (e) { console.error("initEventListeners error:", e); }
    try { startTickerTimer(); } catch (e) { console.error("startTickerTimer error:", e); }
    try { startTvClock(); } catch (e) { console.error("startTvClock error:", e); }

    // Silent background auto-sync immediately and every 1 minute (हर मिनट ऑटो-रिफ्रेश)
    silentBackgroundSync();
    setInterval(silentBackgroundSync, 30 * 1000);

    // Fast 30-second silent sync for Instagram stories (@news5indiaa)
    syncInstagramStories();
    setInterval(syncInstagramStories, 30 * 1000);
  }

  /* --------------------------------------------------------------------------
     Fast Silent Instagram Stories Sync (Runs every 30 seconds)
     -------------------------------------------------------------------------- */
  async function syncInstagramStories() {
    try {
      const instaRes = await fetch("data/instagram-stories.json?t=" + Date.now());
      if (instaRes.ok) {
        const instaData = await instaRes.json();
        if (instaData.stories && instaData.stories.length) {
          const target = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
          if (target) {
            // Check if there is new content
            const currentFirstId = target.webStories && target.webStories[0] ? target.webStories[0].id : '';
            const newFirstId = instaData.stories[0] ? instaData.stories[0].id : '';
            target.webStories = instaData.stories;
            if (currentFirstId !== newFirstId) {
              renderWebStories();
            }
          }
        }
      }
    } catch(e) {
      // silent
    }
  }

  /* ==========================================================================
     2. Silent Background Auto-Sync (Keeps world & national news fresh)
     ========================================================================== */
  function romanizeHindiText(input) {
    const consonants = {
      "क":"k","ख":"kh","ग":"g","घ":"gh","ङ":"ng","च":"ch","छ":"chh","ज":"j","झ":"jh","ञ":"ny",
      "ट":"t","ठ":"th","ड":"d","ढ":"dh","ण":"n","त":"t","थ":"th","द":"d","ध":"dh","न":"n",
      "प":"p","फ":"ph","ब":"b","भ":"bh","म":"m","य":"y","र":"r","ल":"l","व":"v",
      "श":"sh","ष":"sh","स":"s","ह":"h","क़":"q","ख़":"kh","ग़":"gh","ज़":"z","ड़":"r","ढ़":"rh","फ़":"f"
    };
    const vowels = {"अ":"a","आ":"aa","इ":"i","ई":"ee","उ":"u","ऊ":"oo","ऋ":"ri","ए":"e","ऐ":"ai","ओ":"o","औ":"au"};
    const marks = {"ा":"aa","ि":"i","ी":"ee","ु":"u","ू":"oo","ृ":"ri","े":"e","ै":"ai","ो":"o","ौ":"au","ं":"n","ँ":"n","ः":"h"};
    return String(input || "").split(/(\s+)/).map(word => {
      if (!/[\u0900-\u097F]/.test(word)) return word;
      const chars = Array.from(word);
      let out = "";
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (consonants[ch]) {
          let syllable = consonants[ch] + "a";
          const next = chars[i + 1];
          if (next === "्") { syllable = consonants[ch]; i++; }
          else if (marks[next]) { syllable = consonants[ch] + marks[next]; i++; }
          out += syllable;
        } else if (vowels[ch]) out += vowels[ch];
        else if (marks[ch]) out += marks[ch];
        else if (ch === "्" || ch === "़" || ch === "‍" || ch === "‌") continue;
        else out += ch;
      }
      return out.replace(/a\b/gi, "");
    }).join("");
  }
  // Translate the complete visible interface, including text inserted later by renderers.
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  const interfaceEnglish = {
    "होम":"Home","बड़ी खबर":"Breaking News","देश":"National","राज्य / शहर":"States / Cities",
    "राजनीति":"Politics","क्रिकेट / खेल":"Cricket / Sports","मनोरंजन":"Entertainment",
    "बिज़नेस":"Business","दुनिया":"World","फिल्में":"Movies","वेब सीरीज़ / OTT":"Web Series / OTT",
    "ट्रेलर":"Trailers","बॉक्स ऑफिस":"Box Office","विज्ञान":"Science","शिक्षा":"Education",
    "नौकरी":"Jobs","गैजेट्स":"Gadgets","गेमिंग":"Gaming","ऑटो / EV":"Auto / EV",
    "हेल्थ":"Health","मौसम":"Weather","कृषि":"Agriculture","पर्यावरण":"Environment","टेक":"Technology",
    "वीडियो":"Videos","वेब स्टोरीज़":"Web Stories","लॉगिन":"Login","लॉगिन करें":"Log in",
    "नया अकाउंट":"Create account","अकाउंट बनाएं":"Create account","यूज़रनेम या ईमेल":"Username or email",
    "पासवर्ड":"Password","ईमेल":"Email","रील सेव करने के लिए लॉगिन करें या अकाउंट बनाएं।":"Log in or create an account to save reels.",
    "लेटेस्ट वीडियो और रील्स":"Latest Videos & Reels","मेरी सेव की गई रील्स":"My Saved Reels",
    "रील का टाइटल *":"Reel Title *","कैटेगरी":"Category","रील का Description *":"Reel Description *",
    "रील / वीडियो URL *":"Reel / Video URL *","रील पब्लिश करें":"Publish Reel",
    "मुख्य बिंदु:":"Key Points:","पाठकों की प्रतिक्रियाएं (टिप्पणियां)":"Reader Comments",
    "सबसे ज्यादा पढ़ी गई खबरें":"Most Read Stories","प्रमुख श्रेणियां":"Top Categories",
    "राज्य संस्करण":"State Editions","डिजिटल सेवाएं":"Digital Services","संपादकीय एवं नीतियां":"Editorial & Policies",
    "राज्य चुनें":"Choose State","समाचार खोजें":"Search News","सर्च करें":"Search",
    "ई-पेपर पढ़ें":"Read E-Paper","लाइव टीवी देखें":"Watch Live TV","लाइव प्रसारण देखें":"Watch Live Broadcast",
    "फॉन्ट छोटा करें":"Decrease font size","फॉन्ट बड़ा करें":"Increase font size",
    "डार्क मोड बदलें":"Toggle dark mode","पिछली खबर":"Previous story","अगली खबर":"Next story",
    "रोके या चलाएं":"Pause or play","श्रेणी: ":"Category: ","खबर का शीर्षक":"Story headline",
    "लाइव टीवी प्रसारण":"Live TV Broadcast","डिजिटल ई-पेपर":"Digital E-Paper",
    "विज्ञापन की इमेज चुनें।":"Choose an ad image.","रील पब्लिश हो रही है...":"Publishing reel...",
    "कृपया प्रतीक्षा करें...":"Please wait...","अभी-अभी":"Just now"
  };
  const attributeNames = ["aria-label","title","placeholder","alt"];
  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
      const original = originalTextNodes.get(node);
      let translated = original;
      if (state.currentLanguage === "hinglish") translated = romanizeHindiText(original);
      else if (state.currentLanguage === "en" && interfaceEnglish[original.trim()]) translated = original.replace(original.trim(), interfaceEnglish[original.trim()]);
      if (node.nodeValue !== translated) node.nodeValue = translated;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    attributeNames.forEach(name => {
      if (!node.hasAttribute(name)) return;
      let values = originalAttributes.get(node);
      if (!values) { values = {}; originalAttributes.set(node, values); }
      if (!(name in values)) values[name] = node.getAttribute(name);
      const original = values[name];
      node.setAttribute(name, state.currentLanguage === "hinglish" ? romanizeHindiText(original) :
        state.currentLanguage === "en" ? (interfaceEnglish[original] || original) : original);
    });
    if (node.matches && node.matches("#categoryNav .nav-link")) {
      const slug = node.getAttribute("data-category");
      const hindiCategories = {all:"होम",breaking:"⚡ बड़ी खबर",national:"देश",state:"राज्य / शहर",politics:"राजनीति",sports:"क्रिकेट / खेल",entertainment:"मनोरंजन",business:"बिज़नेस",world:"दुनिया",movies:"फिल्में",ott:"वेब सीरीज़ / OTT",trailers:"ट्रेलर",boxoffice:"बॉक्स ऑफिस",science:"विज्ञान",education:"शिक्षा",jobs:"नौकरी",ai:"AI",gadgets:"गैजेट्स",gaming:"गेमिंग",auto:"ऑटो / EV",health:"हेल्थ",weather:"मौसम",agriculture:"कृषि",environment:"पर्यावरण",tech:"टेक",videos:"वीडियो",webstories:"वेब स्टोरीज़"};
      const englishCategories = {all:"Home",breaking:"⚡ Breaking News",national:"National",state:"States / Cities",politics:"Politics",sports:"Cricket / Sports",entertainment:"Entertainment",business:"Business",world:"World",movies:"Movies",ott:"Web Series / OTT",trailers:"Trailers",boxoffice:"Box Office",science:"Science",education:"Education",jobs:"Jobs",ai:"AI",gadgets:"Gadgets",gaming:"Gaming",auto:"Auto / EV",health:"Health",weather:"Weather",agriculture:"Agriculture",environment:"Environment",tech:"Technology",videos:"Videos",webstories:"Web Stories"};
      const hindi = hindiCategories[slug] || node.textContent;
      const value = state.currentLanguage === "en" ? (englishCategories[slug] || hindi) :
        state.currentLanguage === "hinglish" ? romanizeHindiText(hindi) : hindi;
      if (node.textContent !== value) node.textContent = value;
      return;
    }
    node.childNodes && node.childNodes.forEach(translateNode);
  }
  function applyInterfaceLanguage(root = document.body) {
    if (!root) return;
    translateNode(root);
  }
  const interfaceObserver = new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === "childList") record.addedNodes.forEach(translateNode);
      else if (record.type === "characterData") translateNode(record.target);
    });
  });
  if (document.body) {
    applyInterfaceLanguage();
    interfaceObserver.observe(document.body, {subtree:true,childList:true,characterData:true});
  }

  function hinglishArticle(article) {
    const copy = { ...article };
    ["title", "excerpt", "category", "author", "date", "stateName"].forEach(key => {
      if (typeof copy[key] === "string") copy[key] = romanizeHindiText(copy[key]);
    });
    if (typeof copy.content === "string") {
      copy.content = copy.content.replace(/>([^<]+)</g, (match, text) => ">" + romanizeHindiText(text) + "<");
    }
    if (Array.isArray(copy.bullets)) copy.bullets = copy.bullets.map(romanizeHindiText);
    return copy;
  }

  async function silentBackgroundSync() {
    try {
      const languageFile = state.currentLanguage === "en" ? "data/live-news-en.json" : "data/live-news.json";
      const res = await fetch(languageFile + "?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const liveData = await res.json();
        const target = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
        if (target && Array.isArray(liveData.articles)) {
          const articles = state.currentLanguage === "hinglish"
            ? liveData.articles.map(hinglishArticle)
            : liveData.articles;
          target.articles = articles;
          const newest = articles[0];
          target.leadStory = newest ? {
            ...newest,
            subtitle: newest.excerpt || newest.title,
            bullets: [],
            date: newest.date || (state.currentLanguage === "en" ? "Just now" : "Abhi-abhi"),
            readTime: state.currentLanguage === "en" ? "2 min read" : "2 minute"
          } : null;
          renderLeadStory();
          target.breaking = articles.slice(0, 5).map(article => ({
            id: "brk-" + article.id,
            title: article.title,
            category: article.category,
            time: article.date || ""
          }));
          state.tickerIndex = 0;
          renderTicker();
          renderNewsFeed();
        }
      }
    } catch (e) {
      console.warn("Live news sync failed:", e.message);
    }

    // Keep Instagram stories independent from the selected news language.
    try {
      const instaRes = await fetch("data/instagram-stories.json?t=" + Date.now(), { cache: "no-store" });
      if (instaRes.ok) {
        const instaData = await instaRes.json();
        if (Array.isArray(instaData.stories) && instaData.stories.length) {
          const target = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
          if (target) {
            target.webStories = instaData.stories;
            renderWebStories();
          }
        }
      }
    } catch (e) {
      // Keep the news feed working even if Instagram is unavailable.
    }
  }

  function changeNewsLanguage(language) {
    if (!["hi", "hinglish", "en"].includes(language)) return;
    state.currentLanguage = language;
    localStorage.setItem("news5_language", language);
    applyInterfaceLanguage();
    silentBackgroundSync().then(() => {
      const labels = { hi: "हिन्दी", hinglish: "Hinglish", en: "English" };
      showToast(labels[language] + " news selected");
    });
  }

  /* ==========================================================================
     3. Theme Management (Light / Dark)
     ========================================================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem("news5_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("news5_theme", next);
    updateThemeIcon(next);
    showToast(next === "dark" ? "डार्क मोड सक्रिय किया गया" : "लाइट मोड सक्रिय किया गया");
  }

  function updateThemeIcon(theme) {
    if (elements.themeIcon) {
      elements.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  /* ==========================================================================
     4. Date & Time
     ========================================================================== */
  function updateLiveDate() {
    const now = new Date();
    const days = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    const months = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    if (elements.liveDate) {
      elements.liveDate.textContent = `${dayName}, ${dateNum} ${monthName} ${year}`;
    }
  }

  function startTvClock() {
    setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      if (elements.tvTimeCode) {
        elements.tvTimeCode.textContent = `${h}:${m}:${s} IST`;
      }
    }, 1000);
  }

  /* ==========================================================================
     5. Cricket Live Score Strip
     ========================================================================== */
  function renderCricketWidget() {
    const data = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
    if (!data || !data.cricketMatch) {
      if (elements.cricketStrip) elements.cricketStrip.hidden = true;
      return;
    }
    if (elements.cricketStrip) elements.cricketStrip.hidden = false;
    const match = data.cricketMatch;

    if (elements.cricketTournament) elements.cricketTournament.textContent = match.tournament;
    if (elements.cricketStatus) elements.cricketStatus.textContent = match.status;
    if (elements.team1Score) elements.team1Score.textContent = match.team1.score;
    if (elements.team2Score) elements.team2Score.textContent = match.team2.score;
    if (elements.cricketNote) elements.cricketNote.textContent = match.note;
  }

  /* ==========================================================================
     6. Breaking News Ticker (Automatic Smooth Slide)
     ========================================================================== */
  function renderTicker() {
    const data = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
    const breaking = data && data.breaking;
    if (!elements.tickerSlider) return;
    if (!Array.isArray(breaking) || !breaking.length) {
      elements.tickerSlider.innerHTML = "";
      state.tickerIndex = 0;
      return;
    }
    if (state.tickerIndex >= breaking.length || state.tickerIndex < 0) state.tickerIndex = 0;

    // Render all headlines into DOM
    elements.tickerSlider.innerHTML = breaking.map((item, idx) => `
      <div class="ticker-item ${idx === state.tickerIndex ? 'active' : ''}" data-ticker-id="${item.id}" data-index="${idx}">
        <span class="ticker-cat">${item.category}</span>
        <span class="ticker-headline">${item.title}</span>
      </div>
    `).join("");

    // Click on headline opens full article
    elements.tickerSlider.querySelectorAll(".ticker-item").forEach(itemEl => {
      itemEl.addEventListener("click", () => {
        const id = itemEl.getAttribute("data-ticker-id");
        const breakingItem = NEWS_DATA.breaking.find(b => b.id === id);
        const articleId = breakingItem ? String(breakingItem.id).replace(/^brk-/, "") : "";
        const found = (NEWS_DATA.articles || []).find(article => article.id === articleId);
        if (found) openArticleModal(found);
      });
    });
  }

  function slideTicker(newIndex) {
    const items = elements.tickerSlider ? elements.tickerSlider.querySelectorAll(".ticker-item") : [];
    if (!items.length) return;

    const total = items.length;
    const oldIndex = state.tickerIndex;
    state.tickerIndex = (newIndex + total) % total;

    items.forEach((item, idx) => {
      if (idx === oldIndex) {
        item.classList.remove("active");
        item.classList.add("slide-out");
        setTimeout(() => item.classList.remove("slide-out"), 450);
      } else if (idx === state.tickerIndex) {
        item.classList.remove("slide-out");
        item.classList.add("active");
      } else {
        item.classList.remove("active", "slide-out");
      }
    });
  }

  function nextTicker() {
    slideTicker(state.tickerIndex + 1);
  }

  function prevTicker() {
    slideTicker(state.tickerIndex - 1);
  }

  function startTickerTimer() {
    stopTickerTimer();
    state.tickerInterval = setInterval(() => {
      if (state.isTickerPlaying) {
        nextTicker();
      }
    }, 3800);
  }

  function stopTickerTimer() {
    if (state.tickerInterval) {
      clearInterval(state.tickerInterval);
      state.tickerInterval = null;
    }
  }

  /* ==========================================================================
     7. Lead Story (बड़ी खबरें)
     ========================================================================== */
  function renderLeadStory() {
    const data = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
    if (!elements.leadStoryContainer) return;
    if (!data || !data.leadStory) {
      elements.leadStoryContainer.innerHTML = "";
      elements.leadStoryContainer.hidden = true;
      return;
    }
    elements.leadStoryContainer.hidden = false;
    const lead = data.leadStory;

    const bulletsHtml = lead.bullets && lead.bullets.length
      ? `<ul class="lead-bullets">
          ${lead.bullets.map(b => `<li>${b}</li>`).join("")}
        </ul>`
      : "";

    elements.leadStoryContainer.innerHTML = `
      <div class="lead-img-wrap">
        <img src="${lead.image}" alt="${lead.title}" class="lead-img" loading="eager" />
        <span class="lead-badge">★ बड़ी खबर</span>
      </div>
      <div class="lead-content">
        <div class="lead-meta">
          <span class="modal-category">${lead.category}</span>
          <span>• ${lead.date}</span>
          <span>• ⏱️ ${lead.readTime}</span>
        </div>
        <h2 class="lead-title">${lead.title}</h2>
        <p class="lead-subtitle">${lead.subtitle}</p>
        ${bulletsHtml}
        <div class="lead-footer">
          <span class="lead-author">✍️ ${lead.author}</span>
          <span class="lead-read-btn">पूरी खबर पढ़ें ›</span>
        </div>
      </div>
    `;

    elements.leadStoryContainer.onclick = () => openArticleModal(lead);
  }

  /* ==========================================================================
     8. News Feed Filtering & Rendering
     ========================================================================== */
  function getFilteredArticles() {
    const data = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
    if (!data || !Array.isArray(data.articles)) return [];
    let list = [...data.articles];

    // Category filter
    if (state.currentCategory !== "all") {
      if (state.currentCategory === "breaking") {
        list = list.slice(0, 6);
      } else {
        list = list.filter(item => item.categorySlug === state.currentCategory);
      }
    }

    // State filter
    if (state.currentState !== "all") {
      list = list.filter(item => item.state === state.currentState);
    }

    // Search query filter
    if (state.searchQuery && state.searchQuery.trim() !== "") {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.stateName && item.stateName.toLowerCase().includes(q))
      );
    }

    return list;
  }

  function renderNewsFeed() {
    if (!elements.newsCardsGrid) return;
    const filtered = getFilteredArticles();
    renderCategoryShelves();

    if (elements.filterHeader) {
      if (state.currentCategory !== "all" || state.currentState !== "all" || state.searchQuery) {
        elements.filterHeader.style.display = "flex";
        let filterText = "श्रेणी: ";
        if (state.searchQuery) filterText += `सर्च "${state.searchQuery}"`;
        else if (state.currentCategory !== "all") filterText += getCategoryName(state.currentCategory);
        if (state.currentState !== "all") filterText += ` • राज्य: ${getStateName(state.currentState)}`;
        if (elements.filterTitle) elements.filterTitle.textContent = filterText;
      } else {
        elements.filterHeader.style.display = "none";
      }
    }

    if (!filtered.length) {
      elements.newsCardsGrid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 40px; text-align: center; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-light);">
          <p style="font-size: 1.2rem; font-weight: 700; color: var(--text-heading); margin-bottom: 8px;">कोई समाचार नहीं मिला</p>
          <p style="color: var(--text-muted); font-size: 0.95rem;">कृपया अन्य श्रेणी या कीवर्ड चुनकर प्रयास करें।</p>
          <button type="button" class="btn-primary-action" style="max-width: 200px; margin: 16px auto 0;" id="resetFilterFromEmpty">सभी समाचार देखें</button>
        </div>
      `;
      const btn = document.getElementById("resetFilterFromEmpty");
      if (btn) btn.onclick = resetAllFilters;
      return;
    }

    elements.newsCardsGrid.innerHTML = filtered.map(item => `
      <article class="news-card" data-article-id="${item.id}">
        <div class="news-card-img-wrap">
          <img src="${item.image}" alt="${item.title}" class="news-card-img" loading="lazy" />
          <span class="card-category-badge">${item.category}${item.stateName ? ` • ${item.stateName}` : ''}</span>
        </div>
        <div class="news-card-body">
          <div class="news-card-meta">
            <span>⏱️ ${item.readTime || '3 मिनट'}</span>
            <span>• ${item.date}</span>
          </div>
          <h3 class="news-card-title">${item.title}</h3>
          <p class="news-card-excerpt">${item.excerpt || ''}</p>
          <div class="news-card-footer">
            <span class="views-count">${item.source ? 'स्रोत: ' + item.source : (item.views && item.views !== '—' ? '👁️ ' + item.views + ' पाठक' : 'प्रकाशित समाचार')}</span>
            <span class="read-link">मूल स्रोत सहित पढ़ें ›</span>
          </div>
        </div>
      </article>
    `).join("");

    elements.newsCardsGrid.querySelectorAll(".news-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-article-id");
        const found = NEWS_DATA.articles.find(a => a.id === id);
        if (found) openArticleModal(found);
      });
    });
  }

  function renderCategoryShelves() {
    const host = elements.categoryShelves;
    if (!host) return;
    const data = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
    const articles = data && Array.isArray(data.articles) ? data.articles : [];
    const showHomeShelves = state.currentCategory === "all" && state.currentState === "all" && !state.searchQuery;
    host.parentElement.hidden = !showHomeShelves;
    if (!showHomeShelves) return;
    const desks = [
      ["national","देश की खबरें"],["state","राज्य और शहर"],["politics","राजनीति"],
      ["world","दुनिया"],["crime","अपराध"],["sports","खेल"],
      ["business","बिज़नेस और बाजार"],["entertainment","मनोरंजन"],
      ["tech","टेक्नोलॉजी और AI"],["education","शिक्षा और परीक्षा"],
      ["jobs","नौकरी और करियर"],["health","हेल्थ"],
      ["weather","मौसम"],["agriculture","कृषि और किसान"],
      ["auto","ऑटो और EV"],["science","विज्ञान और अंतरिक्ष"],
      ["religion","धर्म और आस्था"],["lifestyle","लाइफस्टाइल"],
      ["law","कानून और कोर्ट"],["defense","डिफेंस"],
      ["factcheck","फैक्ट चेक"],["finance","पर्सनल फाइनेंस"],
      ["markets","सोना-चांदी और बाजार"],["travel","यात्रा और पर्यटन"],
      ["trending","वायरल और ट्रेंडिंग"],["ground","ग्राउंड रिपोर्ट"],
      ["women","महिला जगत"],["governance","सरकार और नीति"]
    ];
    const sections = desks.map(([slug,label]) => {
      const items = articles.filter(item => item.categorySlug === slug).slice(0,3);
      if (!items.length) return "";
      return `
        <section class="category-shelf" data-shelf="${slug}">
          <div class="category-shelf-head">
            <h3>${label}</h3>
            <button type="button" class="category-shelf-more" data-open-category="${slug}">और खबरें देखें ›</button>
          </div>
          <div class="category-shelf-grid">
            ${items.map(item => `
              <article class="category-shelf-card" data-shelf-article="${item.id}">
                <img src="${item.image || ''}" alt="" loading="lazy">
                <div class="category-shelf-copy">
                  <span class="category-shelf-meta">${item.stateName ? item.stateName + ' · ' : ''}${item.date || ''}</span>
                  <h4>${item.title}</h4>
                  <p>${item.excerpt || ''}</p>
                </div>
              </article>`).join("")}
          </div>
        </section>`;
    }).filter(Boolean);
    host.innerHTML = sections.length ? sections.join("") : '<p class="category-shelf-empty">अलग-अलग श्रेणियों की ताज़ा खबरें उपलब्ध होते ही यहाँ दिखाई देंगी।</p>';
    host.querySelectorAll("[data-shelf-article]").forEach(card => {
      card.addEventListener("click", () => {
        const item = articles.find(article => article.id === card.getAttribute("data-shelf-article"));
        if (item) openArticleModal(item);
      });
    });
    host.querySelectorAll("[data-open-category]").forEach(button => {
      button.addEventListener("click", () => {
        const link = elements.categoryNav && elements.categoryNav.querySelector('[data-category="' + button.dataset.openCategory + '"]');
        if (link) link.click();
      });
    });
  }

  function getCategoryName(slug) {
    const map = {
      national: "देश", world: "दुनिया", state: "राज्य व शहर",
      politics: "राजनीति", sports: "क्रिकेट व खेल", entertainment: "मनोरंजन",
      movies: "फिल्में", ott: "वेब सीरीज़ और OTT", trailers: "ट्रेलर और टीज़र",
      boxoffice: "बॉक्स ऑफिस", business: "बिज़नेस व मार्केट", tech: "टेक्नोलॉजी",
      ai: "AI और टेक", gadgets: "मोबाइल और गैजेट्स", gaming: "गेमिंग और ई-स्पोर्ट्स",
      auto: "ऑटो और EV", science: "विज्ञान और अंतरिक्ष", education: "शिक्षा और परीक्षा",
      jobs: "सरकारी नौकरी और भर्ती", health: "स्वास्थ्य", weather: "मौसम",
      agriculture: "कृषि", environment: "पर्यावरण", breaking: "बड़ी खबर",
      videos: "वीडियो", webstories: "वेब स्टोरीज़"
    };
    const englishMap = {
      national: "National", world: "World", state: "State / City", politics: "Politics",
      sports: "Sports", entertainment: "Entertainment", movies: "Movies", ott: "Web Series / OTT",
      trailers: "Trailers", boxoffice: "Box Office", business: "Business", tech: "Technology",
      ai: "AI & Tech", gadgets: "Gadgets", gaming: "Gaming", auto: "Auto & EV",
      science: "Science", education: "Education", jobs: "Jobs", health: "Health",
      weather: "Weather", agriculture: "Agriculture", environment: "Environment",
      breaking: "Breaking News", videos: "Videos", webstories: "Web Stories"
    };
    const value = state.currentLanguage === "en" ? (englishMap[slug] || map[slug] || slug) : (map[slug] || slug);
    return state.currentLanguage === "hinglish" ? romanizeHindiText(value) : value;
  }

  function getStateName(slug) {
    const map = {
      up: "उत्तर प्रदेश",
      bihar: "बिहार",
      delhi: "दिल्ली",
      mp: "मध्य प्रदेश",
      rajasthan: "राजस्थान"
    };
    const englishMap = { up: "Uttar Pradesh", bihar: "Bihar", delhi: "Delhi", mp: "Madhya Pradesh", rajasthan: "Rajasthan" };
    const value = state.currentLanguage === "en" ? (englishMap[slug] || map[slug] || slug) : (map[slug] || slug);
    return state.currentLanguage === "hinglish" ? romanizeHindiText(value) : value;
  }

  function resetAllFilters() {
    state.currentCategory = "all";
    state.currentState = "all";
    state.searchQuery = "";
    if (elements.globalSearchInput) elements.globalSearchInput.value = "";

    elements.categoryNav.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    const firstNav = elements.categoryNav.querySelector(".nav-item:first-child");
    if (firstNav) firstNav.classList.add("active");

    elements.stateChips.querySelectorAll(".state-chip").forEach(chip => {
      chip.classList.toggle("active", chip.getAttribute("data-state") === "all");
    });

    renderNewsFeed();
    showToast("सभी समाचार प्रदर्शित किए गए हैं");
  }

  /* ==========================================================================
     9. Web Stories, Videos & Trending Rendering
     ========================================================================== */
  function renderWebStories() {
    const data = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
    const stories = data && data.webStories;
    if (!stories || !elements.webStoriesTrack) return;

    elements.webStoriesTrack.innerHTML = stories.map(s => {
      const instaLink = s.instaUrl || "https://www.instagram.com/news5indiaa?dlrf=MXZ1ZHV0dTZhOW4xdw==";
      return `
        <div class="story-card insta-story-card" data-story-id="${s.id}" data-insta-url="${instaLink}">
          <img src="${s.image}" alt="${s.title}" class="story-img" loading="lazy" />
          <div class="story-insta-header">
            <span class="insta-cam-mini">📸</span>
            <span class="insta-handle-text">@news5indiaa</span>
          </div>
          <div class="story-overlay">
            <span class="story-tag insta-tag">${s.category || '📸 Instagram Reel'}</span>
            <h4 class="story-title">${s.title}</h4>
            <div class="story-action-row">
              <span class="story-time-meta">${s.date || 'Instagram'}</span>
              <a href="${instaLink}" target="_blank" rel="noopener noreferrer" class="story-insta-btn" onclick="event.stopPropagation();">
                <span>Reel देखें</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join("");

    elements.webStoriesTrack.querySelectorAll(".story-card").forEach(sc => {
      sc.addEventListener("click", () => {
        const url = sc.getAttribute("data-insta-url");
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      });
    });
  }

  function renderVideos() {
    const data = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
    const videos = data && data.videos;
    if (!videos || !elements.videoGrid) return;

    elements.videoGrid.innerHTML = videos.map(v => `
      <div class="video-card" data-video-id="${v.id}">
        <div class="video-thumb-wrap">
          <img src="${v.thumbnail}" alt="${v.title}" class="video-thumb" loading="lazy" />
          <span class="video-duration">⏱️ ${v.duration}</span>
          <div class="video-play-icon">▶</div>
        </div>
        <div class="video-info">
          <h4 class="video-title">${v.title}</h4>
          <div class="video-meta">
            <span>👤 ${v.anchor}</span> • <span>👁️ ${v.views} व्यूज</span>
          </div>
        </div>
      </div>
    `).join("");

    elements.videoGrid.querySelectorAll(".video-card").forEach(vc => {
      vc.addEventListener("click", () => {
        openLiveTvModal();
      });
    });
  }

  function renderTrending() {
    const data = window.NEWS_DATA || (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : null);
    const items = data && (data.mostRead || data.trending);
    if (!items || !elements.trendingList) return;

    elements.trendingList.innerHTML = items.map(item => `
      <li class="trending-item" data-rank="${item.rank}">
        <div class="trending-rank">${item.rank}</div>
        <div class="trending-info">
          <div class="trending-cat">${item.category}</div>
          <div class="trending-headline">${item.title}</div>
        </div>
      </li>
    `).join("");

    elements.trendingList.querySelectorAll(".trending-item").forEach(el => {
      el.addEventListener("click", () => {
        const headline = el.querySelector(".trending-headline").textContent;
        const cat = el.querySelector(".trending-cat").textContent;
        openArticleModal({
          id: `trend-${Date.now()}`,
          title: headline,
          category: cat,
          date: "25 अक्टूबर 2026, 05:40 PM",
          author: "News5Indiaa विशेष डेस्क",
          readTime: "3 मिनट",
          image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80",
          content: `<p>${headline}। यह खबर आज देश भर के पाठकों द्वारा सबसे ज्यादा पढ़ी और साझा की जा रही है। पूर्ण विवरण और विश्लेषण के लिए जुड़े रहें News5Indiaa के साथ।</p>`
        });
      });
    });
  }

  /* ==========================================================================
     10. Article Reader Modal & Text-to-Speech (TTS)
     ========================================================================== */
  function openArticleModal(article) {
    state.currentArticle = article;
    stopSpeech();

    elements.modalCategory.textContent = article.category || "मुख्य समाचार";
    elements.modalDate.textContent = article.date || "25 अक्टूबर 2026";
    elements.modalArticleTitle.textContent = article.title;
    elements.modalAuthor.textContent = article.author || "News5Indiaa विशेष संवाददाता";
    elements.modalReadTime.textContent = article.readTime || "3 मिनट वाचन";
    elements.modalImage.src = article.image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800";
    elements.modalCaption.textContent = `फोटो साभार: News5Indiaa आर्काइव`;

    if (article.bullets && article.bullets.length) {
      elements.modalBulletsWrap.style.display = "block";
      elements.modalBulletsList.innerHTML = article.bullets.map(b => `<li>${b}</li>`).join("");
    } else {
      elements.modalBulletsWrap.style.display = "none";
    }

    elements.modalArticleContent.innerHTML = article.content || `<p>${article.excerpt || article.title}</p>`;
    if (article.articleUrl && /^https:\/\//i.test(article.articleUrl)) {
      const sourceNote = document.createElement("p");
      sourceNote.className = "article-source-link";
      const sourceLink = document.createElement("a");
      sourceLink.href = article.articleUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      sourceLink.textContent = `मूल खबर ${article.source ? '(' + article.source + ')' : 'के स्रोत'} पर पढ़ें ↗`;
      sourceNote.appendChild(sourceLink);
      elements.modalArticleContent.appendChild(sourceNote);
    }

    resetTtsUi();

    elements.articleModalBackdrop.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeArticleModal() {
    stopSpeech();
    elements.articleModalBackdrop.setAttribute("hidden", "true");
    document.body.style.overflow = "";
    state.currentArticle = null;
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window)) {
      showToast("आपके ब्राउज़र में ऑडियो वाचन समर्थित नहीं है।");
      return;
    }

    if (state.isSpeaking) {
      stopSpeech();
      return;
    }

    if (!state.currentArticle) return;

    const textToRead = `${state.currentArticle.title}। ${state.currentArticle.bullets ? state.currentArticle.bullets.join("। ") : ""}। ${stripHtml(state.currentArticle.content || state.currentArticle.excerpt || "")}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = state.currentLanguage === "en" ? "en-IN" : "hi-IN";
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find(v => v.lang.includes("hi") || v.name.includes("Hindi"));
    if (hiVoice) {
      utterance.voice = hiVoice;
    }

    utterance.onstart = () => {
      state.isSpeaking = true;
      elements.ttsPlayBtn.classList.add("playing");
      elements.ttsIcon.textContent = "⏸";
      elements.ttsLabel.textContent = "रोकें";
      showToast("ऑडियो वाचन शुरू हुआ...");
    };

    utterance.onend = () => resetTtsUi();
    utterance.onerror = () => resetTtsUi();

    state.speechUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    resetTtsUi();
  }

  function resetTtsUi() {
    state.isSpeaking = false;
    elements.ttsPlayBtn.classList.remove("playing");
    elements.ttsIcon.textContent = "🔊";
    elements.ttsLabel.textContent = "खबर सुनें";
  }

  function stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  /* ==========================================================================
     11. Live TV & E-Paper Modals
     ========================================================================== */
  function openLiveTvModal() {
    elements.liveTvModalBackdrop.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLiveTvModal() {
    elements.liveTvModalBackdrop.setAttribute("hidden", "true");
    document.body.style.overflow = "";
  }

  function openEpaperModal() {
    elements.epaperModalBackdrop.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeEpaperModal() {
    elements.epaperModalBackdrop.setAttribute("hidden", "true");
    document.body.style.overflow = "";
  }

  /* ==========================================================================
     12. Mobile Drawer Controls
     ========================================================================== */
  function openDrawer() {
    elements.mobileDrawer.classList.add("active");
    elements.drawerBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    elements.mobileDrawer.classList.remove("active");
    elements.drawerBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  /* ==========================================================================
     13. Toast Notification
     ========================================================================== */
  function showToast(msg) {
    if (!elements.toastNotification) return;
    elements.toastNotification.textContent = msg;
    elements.toastNotification.classList.add("active");
    setTimeout(() => {
      elements.toastNotification.classList.remove("active");
    }, 3200);
  }

  /* ==========================================================================
     14. Event Listeners Setup
     ========================================================================== */
  function initEventListeners() {
    // News language selector
    if (elements.newsLanguageSelect) {
      elements.newsLanguageSelect.value = state.currentLanguage;
      elements.newsLanguageSelect.addEventListener("change", event => changeNewsLanguage(event.target.value));
    }

    // Theme toggle
    elements.themeToggleBtn.addEventListener("click", toggleTheme);

    // Font Sizing Controls
    elements.btnFontDec.addEventListener("click", () => {
      state.fontSizeDelta = Math.max(state.fontSizeDelta - 0.05, -0.15);
      document.documentElement.style.setProperty("--user-font-scale", `${1 + state.fontSizeDelta}rem`);
    });

    elements.btnFontInc.addEventListener("click", () => {
      state.fontSizeDelta = Math.min(state.fontSizeDelta + 0.05, 0.25);
      document.documentElement.style.setProperty("--user-font-scale", `${1 + state.fontSizeDelta}rem`);
    });

    elements.modalFontDec.addEventListener("click", () => {
      const current = parseFloat(window.getComputedStyle(elements.modalArticleContent).fontSize);
      elements.modalArticleContent.style.fontSize = `${Math.max(current - 2, 14)}px`;
    });

    elements.modalFontInc.addEventListener("click", () => {
      const current = parseFloat(window.getComputedStyle(elements.modalArticleContent).fontSize);
      elements.modalArticleContent.style.fontSize = `${Math.min(current + 2, 28)}px`;
    });

    // Category Nav Click
    elements.categoryNav.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        elements.categoryNav.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
        link.closest(".nav-item").classList.add("active");

        const cat = link.getAttribute("data-category");
        state.currentCategory = cat;

        elements.newsCardsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
        renderNewsFeed();
      });
    });

    // State Chips Click
    elements.stateChips.querySelectorAll(".state-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        elements.stateChips.querySelectorAll(".state-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.currentState = chip.getAttribute("data-state");
        renderNewsFeed();
      });
    });

    // Clear filter
    elements.clearFilterBtn.addEventListener("click", resetAllFilters);

    // Ticker Controls
    elements.tickerNextBtn.addEventListener("click", () => {
      nextTicker();
      state.isTickerPlaying = true;
      elements.tickerPlayPauseBtn.textContent = "⏸";
    });

    elements.tickerPrevBtn.addEventListener("click", () => {
      prevTicker();
      state.isTickerPlaying = true;
      elements.tickerPlayPauseBtn.textContent = "⏸";
    });

    elements.tickerPlayPauseBtn.addEventListener("click", () => {
      state.isTickerPlaying = !state.isTickerPlaying;
      elements.tickerPlayPauseBtn.textContent = state.isTickerPlaying ? "⏸" : "▶";
      if (state.isTickerPlaying) startTickerTimer();
      else stopTickerTimer();
      showToast(state.isTickerPlaying ? "टिकर शुरू हुआ" : "टिकर रोका गया");
    });

    const tickerContainer = document.getElementById("tickerContainer");
    if (tickerContainer) {
      tickerContainer.addEventListener("mouseenter", () => stopTickerTimer());
      tickerContainer.addEventListener("mouseleave", () => {
        if (state.isTickerPlaying) startTickerTimer();
      });
    }

    // Search
    elements.searchTriggerBtn.addEventListener("click", () => {
      const isHidden = elements.searchOverlay.hasAttribute("hidden");
      if (isHidden) {
        elements.searchOverlay.removeAttribute("hidden");
        elements.globalSearchInput.focus();
      } else {
        elements.searchOverlay.setAttribute("hidden", "true");
      }
    });

    elements.closeSearchBtn.addEventListener("click", () => {
      elements.searchOverlay.setAttribute("hidden", "true");
    });

    elements.clearSearchBtn.addEventListener("click", () => {
      elements.globalSearchInput.value = "";
      state.searchQuery = "";
      renderNewsFeed();
    });

    elements.globalSearchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderNewsFeed();
    });

    elements.searchSuggestions.querySelectorAll(".tag-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const query = pill.getAttribute("data-search");
        elements.globalSearchInput.value = query;
        state.searchQuery = query;
        renderNewsFeed();
        elements.newsCardsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Hamburger & Drawer
    elements.hamburgerBtn.addEventListener("click", openDrawer);
    elements.closeDrawerBtn.addEventListener("click", closeDrawer);
    elements.drawerBackdrop.addEventListener("click", closeDrawer);

    elements.mobileDrawer.querySelectorAll(".drawer-link").forEach(link => {
      link.addEventListener("click", (e) => {
        const cat = link.getAttribute("data-category");
        if (cat) {
          e.preventDefault();
          state.currentCategory = cat;
          renderNewsFeed();
          closeDrawer();
          elements.newsCardsGrid.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    elements.mobileDrawer.querySelectorAll(".drawer-state-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const st = btn.getAttribute("data-state");
        state.currentState = st;
        elements.stateChips.querySelectorAll(".state-chip").forEach(c => {
          c.classList.toggle("active", c.getAttribute("data-state") === st);
        });
        renderNewsFeed();
        closeDrawer();
        elements.newsCardsGrid.scrollIntoView({ behavior: "smooth" });
      });
    });

    // Live TV Triggers
    elements.btnTopLiveTv.addEventListener("click", openLiveTvModal);
    elements.btnHeaderLiveTv.addEventListener("click", openLiveTvModal);
    if (elements.liveTvSidebarTrigger) elements.liveTvSidebarTrigger.addEventListener("click", openLiveTvModal);
    if (elements.footerLiveTvLink) elements.footerLiveTvLink.addEventListener("click", (e) => {
      e.preventDefault();
      openLiveTvModal();
    });
    elements.closeLiveTvBtn.addEventListener("click", closeLiveTvModal);
    elements.liveTvModalBackdrop.addEventListener("click", (e) => {
      if (e.target === elements.liveTvModalBackdrop) closeLiveTvModal();
    });

    // TV Mute button
    if (elements.tvMuteToggleBtn) {
      let isMuted = false;
      elements.tvMuteToggleBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        elements.tvMuteToggleBtn.textContent = isMuted ? "🔇 म्यूटेड" : "🔊 म्यूट / अनम्यूट";
        showToast(isMuted ? "ऑडियो म्यूट किया गया" : "ऑडियो चालू है");
      });
    }

    // E-paper Triggers
    elements.epaperBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openEpaperModal();
    });
    if (elements.openEpaperModalBtn) elements.openEpaperModalBtn.addEventListener("click", openEpaperModal);
    if (elements.footerEpaperLink) elements.footerEpaperLink.addEventListener("click", (e) => {
      e.preventDefault();
      openEpaperModal();
    });
    elements.closeEpaperBtn.addEventListener("click", closeEpaperModal);
    elements.epaperModalBackdrop.addEventListener("click", (e) => {
      if (e.target === elements.epaperModalBackdrop) closeEpaperModal();
    });

    // Article Modal Controls
    elements.closeArticleModalBtn.addEventListener("click", closeArticleModal);
    elements.articleModalBackdrop.addEventListener("click", (e) => {
      if (e.target === elements.articleModalBackdrop) closeArticleModal();
    });

    elements.ttsPlayBtn.addEventListener("click", toggleSpeech);

    // Share buttons
    elements.modalWaShare.addEventListener("click", () => {
      if (!state.currentArticle) return;
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`*${state.currentArticle.title}*\nपढ़ें News5Indiaa पर: `);
      window.open(`https://api.whatsapp.com/send?text=${text}${url}`, "_blank");
    });

    elements.modalXShare.addEventListener("click", () => {
      if (!state.currentArticle) return;
      const text = encodeURIComponent(`${state.currentArticle.title} - News5Indiaa`);
      const url = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    });

    elements.modalCopyShare.addEventListener("click", () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast("लिंक क्लिपबोर्ड पर कॉपी हो गया!");
        });
      } else {
        showToast("लिंक कॉपी किया गया");
      }
    });

    // Comments
    elements.submitCommentBtn.addEventListener("click", () => {
      const name = elements.commenterName.value.trim();
      const text = elements.commenterText.value.trim();

      if (!text) {
        showToast("कृपया अपनी टिप्पणी लिखें");
        return;
      }

      const commentEl = document.createElement("div");
      commentEl.className = "comment-item";
      commentEl.innerHTML = `
        <strong>${name || 'अतिथि पाठक'}:</strong>
        <p>${text}</p>
        <span class="comment-time">अभी-अभी</span>
      `;
      elements.modalCommentsList.prepend(commentEl);

      elements.commenterText.value = "";
      showToast("आपकी टिप्पणी सफलतापूर्वक पोस्ट हो गई!");
    });

    // Poll
    elements.pollOptions.querySelectorAll(".poll-opt-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        elements.pollOptions.style.display = "none";
        elements.pollResult.style.display = "block";
        showToast("आपकी राय दर्ज कर ली गई है! धन्यवाद।");
      });
    });

    if (elements.waJoinBtn) {
      elements.waJoinBtn.addEventListener("click", () => {
        showToast("News5Indiaa व्हाट्सएप चैनल से जुड़ने का लिंक खोला जा रहा है...");
      });
    }

    const viewAllVideosBtn = document.getElementById("viewAllVideosBtn");
    if (viewAllVideosBtn) {
      viewAllVideosBtn.addEventListener("click", () => {
        state.currentCategory = "videos";
        renderNewsFeed();
        elements.videoSection.scrollIntoView({ behavior: "smooth" });
      });
    }

    elements.editionSelect.addEventListener("change", (e) => {
      const city = e.target.value;
      const names = {
        delhi: "दिल्ली (NCR)",
        lucknow: "लखनऊ (UP)",
        patna: "पटना (बिहार)",
        bhopal: "भोपाल (MP)",
        jaipur: "जयपुर (राजस्थान)",
        mumbai: "मुंबई (महाराष्ट्र)"
      };
      showToast(`संस्करण बदला गया: ${names[city] || city}`);
    });

    if (elements.homeLogoLink) {
      elements.homeLogoLink.addEventListener("click", (e) => {
        e.preventDefault();
        resetAllFilters();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!elements.articleModalBackdrop.hasAttribute("hidden")) closeArticleModal();
        if (!elements.liveTvModalBackdrop.hasAttribute("hidden")) closeLiveTvModal();
        if (!elements.epaperModalBackdrop.hasAttribute("hidden")) closeEpaperModal();
        if (elements.mobileDrawer.classList.contains("active")) closeDrawer();
        if (!elements.searchOverlay.hasAttribute("hidden")) elements.searchOverlay.setAttribute("hidden", "true");
      }
    });
  }

  init();
});

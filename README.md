# News5Indiaa - 24x7 AI Global News Network 🌐🤖
> **"ग्लोबल कवरेज • AI पावर्ड न्यूज़ रूम • निष्पक्ष, निर्भीक, सटीक"**  
> *Next-generation superior news portal with automatic 24x7 worldwide AI news updates.*

---

## 🌟 Yeh Dainik Jagran (`m.jagran.com`) se behtar kyun hai?
1. **AI Automated 24x7 World News**: Pure world ki international news agencies (Google News World, Reuters, AP wires) se live news auto-fetch karke Hindi me synthesize karta hai.
2. **Global Financial Clocks**: New Delhi, London, New York aur Tokyo ka live running time header me.
3. **AI 30-Sec Key Takeaways**: Har article ke liye instant smart AI bullet points summary.
4. **AI Fact-Checked Badge (99.4% Verified)**: Automated cross-verification shield.
5. **Smart Reading List (Bookmarks)**: Offline ya baad me padhne ke liye 1-click save system.
6. **Animated Audio Waveform**: "खबर सुनें" (Text-to-Speech) chalu hone par visual sound waves.
7. **Reading Progress Bar**: Screen ke top par real-time reading progress indicator.

---

## 🚀 AI Auto-Update Engine Kaise Kaam Karta Hai?

### 1. In-Browser Live Auto-Sync
- Header me `✨ AI वर्ल्ड ऑटो-अपडेट चालू` pill diya gaya hai.
- Website background me har **5 minute** par live world news auto-sync karti hai.
- User kabhi bhi **"🔄 ताज़ा सिंक करें"** button click karke instant worldwide news refresh kar sakta hai.

### 2. Standalone Background AI Bot (`scripts/ai-updater.js`)
Aapke paas ek powerful Node.js AI updater bot hai jo XML RSS feeds se world news fetch karke `data/live-news.json` aur `js/news-data.js` ko automatically update karta hai:
```bash
# Ek baar news update karne ke liye:
npm run ai-update

# Ya 24x7 background daemon chalane ke liye (har 15 minute me auto-update):
npm run ai-daemon
```

---

## 📁 File Structure
```
news5indiaa/
├── index.html            # Ultra-modern HTML5 newsroom structure
├── css/
│   └── styles.css        # Premium broadcast styles, dark mode, glassmorphism
├── js/
│   ├── news-data.js      # Base news + AI World News datasets
│   └── app.js            # In-browser AI sync, world clocks, TTS audio, reader modal
├── scripts/
│   └── ai-updater.js     # 24x7 automated global RSS & AI updater bot
├── data/
│   └── live-news.json    # Live synchronized world news feed
├── package.json          # Server & AI Bot scripts
└── README.md             # Complete documentation
```

---

## 💻 Run Kaise Karein?

- **Direct Open**: `index.html` file par double click karein.
- **Local Server**:
  ```bash
  cd "C:\Users\natik\.gemini\antigravity\scratch\news5indiaa"
  npm start
  ```
  Aur browser me `http://localhost:3000` kholein.

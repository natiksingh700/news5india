const fs = require('fs');
const p = 'C:/Users/natik/.gemini/antigravity/scratch/news5indiaa/index.html';
let content = fs.readFileSync(p, 'utf8');

// Remove all occurrences of Add Instagram Story Modal
const pattern = /  <!-- Add Instagram Story Modal -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\n?/g;
content = content.replace(pattern, '');

// The modal html
const modalHtml = `  <!-- Add Instagram Story Modal -->
  <div class="modal-backdrop" id="addInstaModalBackdrop" hidden>
    <div class="article-modal insta-sync-modal" role="dialog" aria-modal="true" aria-labelledby="instaModalTitle">
      <div class="modal-header">
        <div class="modal-meta-left">
          <span class="modal-category insta-badge-gradient">📸 Instagram Sync</span>
          <span class="modal-date">@news5indiaa Live Bridge</span>
        </div>
        <button type="button" id="closeAddInstaModalBtn" class="close-modal-btn" aria-label="बंद करें">✕</button>
      </div>
      <div class="insta-modal-body">
        <h3 class="insta-modal-title" id="instaModalTitle">Instagram पोस्ट या Reel को विज़ुअल स्टोरी में जोड़ें</h3>
        <p class="insta-modal-sub">जब भी आप अपने Instagram पेज पर कोई Reel या पोस्ट डालें, उसका लिंक और शीर्षक यहां डालें। यह तुरंत वेबसाइट की विज़ुअल स्टोरीज़ में लाइव हो जाएगा!</p>
        
        <form id="addInstaStoryForm" class="insta-sync-form">
          <div class="form-field">
            <label for="instaPostUrl">Instagram Reel या Post का लिंक <span class="req-star">*</span></label>
            <input type="url" id="instaPostUrl" placeholder="https://www.instagram.com/reel/... या /p/..." required autocomplete="off" />
          </div>
          
          <div class="form-field">
            <label for="instaPostTitle">स्टोरी का शीर्षक / कैप्शन <span class="req-star">*</span></label>
            <input type="text" id="instaPostTitle" placeholder="जैसे: आज की बड़ी ब्रेकिंग न्यूज़ / स्पेशल ग्राउंड रिपोर्ट..." required autocomplete="off" />
          </div>

          <div class="form-field">
            <label for="instaPostImage">फोटो / थंबनेल इमेज लिंक (वैकल्पिक)</label>
            <input type="url" id="instaPostImage" placeholder="https://... (खाली छोड़ सकते हैं)" autocomplete="off" />
          </div>

          <div class="form-field">
            <label for="instaPostCategory">श्रेणी (Category)</label>
            <select id="instaPostCategory">
              <option value="📸 Instagram Reel">📸 Instagram Reel</option>
              <option value="मनोरंजन">मनोरंजन (Bollywood & OTT)</option>
              <option value="बड़ी खबर">बड़ी खबर (Breaking)</option>
              <option value="क्रिकेट">क्रिकेट व खेल</option>
              <option value="ग्राउंड रिपोर्ट">ग्राउंड रिपोर्ट</option>
            </select>
          </div>

          <div class="form-buttons-row">
            <button type="button" class="btn-cancel-modal" id="cancelAddInstaBtn">रद्द करें</button>
            <button type="submit" class="btn-submit-insta" id="submitInstaStoryBtn">🚀 तुरंत वेबसाइट पर लाइव करें</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;

content = content.replace('  <!-- Toast Notification -->', modalHtml + '\n\n  <!-- Toast Notification -->');
fs.writeFileSync(p, content, 'utf8');
console.log('Successfully placed exactly 1 copy before Toast Notification!');

(() => {
  const $ = id => document.getElementById(id);
  const backdrop=$('n5AuthBackdrop'), form=$('n5AuthForm'), account=$('n5AccountBtn');
  if(!backdrop||!form||!account)return;
  let mode='login', user=null;
  const message=$('n5AuthMessage');
  function setMode(next){
    mode=next;
    $('n5LoginTab').classList.toggle('active',mode==='login');
    $('n5RegisterTab').classList.toggle('active',mode==='register');
    $('n5EmailField').hidden=mode!=='register';
    $('n5IdentifierLabel').textContent=mode==='register'?'यूज़रनेम':'यूज़रनेम या ईमेल';
    $('n5AuthIdentifier').name=mode==='register'?'username':'identifier';
    $('n5AuthSubmit').textContent=mode==='register'?'अकाउंट बनाएं':'लॉगिन करें';
    message.textContent='';
  }
  function renderUser(value){
    user=value||null;
    account.textContent=user?(user.role==='admin'?'Admin: '+user.username:user.username):'लॉगिन / साइन अप';
    $('n5LogoutBtn').hidden=!user;
    $('n5AdminPanel').hidden=!(user&&user.role==='admin');
    const adminStudioBtn=$('n5AdminStudioBtn');
    if(adminStudioBtn)adminStudioBtn.hidden=!(user&&user.role==='admin');
    const adForm=$('n5AdForm');
    if(adForm)adForm.hidden=!(user&&user.role==='admin');
    const currentAd=$('n5AdCurrent');
    if(currentAd)currentAd.hidden=!(user&&user.role==='admin');
    if(user&&user.role==='admin')loadAdminAdvertisement();
    const savedSection=$('n5SavedReelsSection');
    if(savedSection)savedSection.hidden=!user;
    loadSavedReels();
  }
  async function api(url,options={}){
    const res=await fetch(url,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'Request असफल रहा।');
    return data;
  }
  function renderPublicAds(ads){
    const slot=$('stickySponsorAd');
    if(!slot||!Array.isArray(ads)||!ads.length)return;
    slot.replaceChildren();
    ads.slice(0,3).forEach(ad=>{
      if(!ad.image_data)return;
      const card=document.createElement('div');card.className='n5-public-ad-slot';
      const strip=document.createElement('div');strip.className='ad-tag-strip';
      const label=document.createElement('span');label.className='ad-label';label.textContent='विज्ञापन';
      const sponsor=document.createElement('span');sponsor.className='ad-sponsor';sponsor.textContent=ad.sponsor||'प्रायोजित';
      strip.append(label,sponsor);
      const visual=document.createElement('div');visual.className='n5-sticky-ad-content';
      const image=document.createElement('img');image.src=ad.image_data;image.alt=ad.title||'Sponsored advertisement';image.loading='lazy';image.className='n5-sticky-ad-image';
      if(ad.click_url){
        const link=document.createElement('a');link.href=ad.click_url;link.target='_blank';link.rel='noopener noreferrer sponsored';link.setAttribute('aria-label',ad.title||'विज्ञापन खोलें');link.append(image);visual.append(link);
      }else visual.append(image);
      const caption=document.createElement('p');caption.className='n5-sticky-ad-title';caption.textContent=ad.title||'प्रायोजित विज्ञापन';
      visual.append(caption);card.append(strip,visual);slot.append(card);
    });
  }
  async function loadAdvertisement(){
    try{const data=await api('/api/advertisements');renderPublicAds(data.advertisements||[]);}
    catch(e){console.warn('Advertisement load failed:',e.message);}
  }
  async function loadAdminAdvertisement(){
    const current=$('n5AdCurrent');if(!current)return;
    try{
      const data=await api('/api/advertisements'),ads=data.advertisements||[];
      current.replaceChildren();
      [1,2,3].forEach(slotNo=>{
        const ad=ads.find(item=>Number(item.slot_no)===slotNo);
        const card=document.createElement('div');card.className='n5-admin-ad-slot'+(ad?' is-filled':'');
        const heading=document.createElement('strong');heading.textContent='Ad Slot '+slotNo+(ad?' — '+ad.title:' — खाली');card.append(heading);
        if(ad){
          const preview=document.createElement('img');preview.src=ad.image_data;preview.alt=ad.title;preview.className='n5-admin-ad-preview';
          const info=document.createElement('p');info.textContent=ad.sponsor||'प्रायोजित';card.append(preview,info);
        }else{
          const empty=document.createElement('p');empty.textContent='अभी कोई विज्ञापन नहीं';card.append(empty);
        }
        const choose=document.createElement('button');choose.type='button';choose.className='n5-account-btn';
        choose.textContent=ad?'इस स्लॉट को बदलें':'इस स्लॉट में जोड़ें';
        choose.addEventListener('click',()=>{
          $('n5AdSlot').value=String(slotNo);
          $('n5AdTitle').value=ad?ad.title:'';
          $('n5AdSponsor').value=ad?(ad.sponsor||''):'';
          $('n5AdLink').value=ad?(ad.click_url||''):'';
          $('n5AdImage').value='';
          $('n5AdMessage').textContent=ad?'Ad Slot '+slotNo+' चुना है। नई फोटो अपलोड करके Publish करें।':'Ad Slot '+slotNo+' खाली है। फोटो अपलोड करें।';
          $('n5AdForm').scrollIntoView({behavior:'smooth',block:'center'});
        });
        card.append(choose);
        if(ad){
          const remove=document.createElement('button');remove.type='button';remove.className='n5-account-btn';remove.textContent='हटाएं';
          remove.addEventListener('click',async()=>{
            if(!confirm('Ad Slot '+slotNo+' का विज्ञापन हटाएं?'))return;
            try{await api('/api/advertisements/'+ad.id,{method:'DELETE'});await loadAdvertisement();await loadAdminAdvertisement();}
            catch(e){alert(e.message);}
          });
          card.append(remove);
        }
        current.append(card);
      });
    }catch(e){current.textContent='विज्ञापन की जानकारी लोड नहीं हो पाई।';}
  }
  function buildReelCard(reel, savedIds, inSavedSection=false){
    const card=document.createElement('article');card.className='n5-reel-card';
    let media;
    if(/\\.mp4($|\\?)/i.test(reel.video_url)){
      media=document.createElement('video');media.src=reel.video_url;media.controls=true;media.playsInline=true;media.preload='metadata';
      if(reel.thumbnail_url)media.poster=reel.thumbnail_url;
    }else{
      media=document.createElement('a');media.href=reel.video_url;media.target='_blank';media.rel='noopener noreferrer';
      const img=document.createElement('img');img.className='n5-reel-media';img.src=reel.thumbnail_url||'assets/logo-badge.jpg';img.alt=reel.title;media.append(img);
      const label=document.createElement('span');label.textContent='रील देखें ↗';label.style.cssText='display:block;padding:8px;color:#b5121b;font-weight:800';media.append(label);
    }
    card.append(media);
    const copy=document.createElement('div');copy.className='n5-reel-copy';
    const title=document.createElement('h3');title.textContent=reel.title;
    const desc=document.createElement('p');desc.textContent=reel.description;
    const category=document.createElement('small');category.textContent=reel.category||'News';category.style.color='#b5121b';
    copy.append(category,title,desc);
    if(user){
      const isSaved=savedIds.has(String(reel.id));
      const save=document.createElement('button');save.type='button';save.className='n5-account-btn n5-save-reel-btn';
      save.textContent=inSavedSection?'✓ Saved — हटाएं':(isSaved?'✓ Saved':'🔖 Save Reel');
      save.setAttribute('aria-pressed',String(isSaved));
      save.addEventListener('click',async()=>{
        save.disabled=true;
        try{
          await api('/api/reels/'+reel.id+'/saved',{method:isSaved?'DELETE':'POST',body:'{}'});
          await loadReels();
        }catch(e){alert(e.message);}finally{save.disabled=false;}
      });
      copy.append(save);
    }else{
      const save=document.createElement('button');save.type='button';save.className='n5-account-btn n5-save-reel-btn';save.textContent='🔖 Save Reel';
      save.addEventListener('click',()=>{backdrop.hidden=false;setMode('login');message.textContent='रील सेव करने के लिए लॉगिन करें या अकाउंट बनाएं।';});
      copy.append(save);
    }
    if(user&&user.role==='admin'){
      const del=document.createElement('button');del.type='button';del.textContent='रील हटाएं';del.className='n5-account-btn';
      del.addEventListener('click',async()=>{if(!confirm('क्या आप यह रील हटाना चाहते हैं?'))return;try{await api('/api/reels/'+reel.id,{method:'DELETE'});await loadReels();}catch(e){alert(e.message);}});
      copy.append(del);
    }
    card.append(copy);return card;
  }
  async function loadSavedReels(){
    const section=$('n5SavedReelsSection'),grid=$('n5SavedReelsGrid');
    if(!section||!grid)return;
    section.hidden=!user;
    if(!user){grid.replaceChildren();return;}
    try{
      const data=await api('/api/reels/saved');grid.replaceChildren();
      if(!data.reels.length){grid.textContent='अभी आपने कोई रील सेव नहीं की है।';return;}
      const ids=new Set(data.reels.map(reel=>String(reel.id)));
      data.reels.forEach(reel=>grid.append(buildReelCard(reel,ids,true)));
    }catch(e){grid.textContent=e.message;}
  }
  async function loadReels(){
    const grid=$('n5ReelsGrid');if(!grid)return;
    try{
      const data=await api('/api/reels');
      const savedData=user?await api('/api/reels/saved'):{reels:[]};
      const savedIds=new Set(savedData.reels.map(reel=>String(reel.id)));
      grid.replaceChildren();
      if(!data.reels.length){grid.textContent='अभी कोई रील प्रकाशित नहीं हुई है।';}
      else data.reels.forEach(reel=>grid.append(buildReelCard(reel,savedIds,false)));
      await loadSavedReels();
    }catch(e){grid.textContent='रील्स लोड नहीं हो पाईं।';}
  }
  account.addEventListener('click',()=>user?$('n5AdminPanel').scrollIntoView({behavior:'smooth',block:'center'}):(backdrop.hidden=false,setMode('login')));
  const adminStudioBtn=$('n5AdminStudioBtn');
  if(adminStudioBtn)adminStudioBtn.addEventListener('click',()=>{ $('n5AdminPanel').hidden=false; $('n5AdminPanel').scrollIntoView({behavior:'smooth',block:'center'}); $('n5ReelTitle').focus({preventScroll:true}); });
  $('n5AuthClose').addEventListener('click',()=>backdrop.hidden=true);
  backdrop.addEventListener('click',e=>{if(e.target===backdrop)backdrop.hidden=true;});
  $('n5LoginTab').addEventListener('click',()=>setMode('login'));
  $('n5RegisterTab').addEventListener('click',()=>setMode('register'));
  form.addEventListener('submit',async e=>{
    e.preventDefault();message.textContent='कृपया प्रतीक्षा करें...';
    const identifier=$('n5AuthIdentifier').value.trim(),password=$('n5AuthPassword').value;
    try{
      let result;
      if(mode==='register')result=await api('/api/auth/register',{method:'POST',body:JSON.stringify({username:identifier,email:$('n5AuthEmail').value.trim(),password})});
      else result=await api('/api/auth/login',{method:'POST',body:JSON.stringify({identifier,password})});
      renderUser(result.user);backdrop.hidden=true;form.reset();await loadReels();
    }catch(err){message.textContent=err.message;}
  });
  $('n5LogoutBtn').addEventListener('click',async()=>{
    try{await api('/api/auth/logout',{method:'POST',body:'{}'});}finally{renderUser(null);loadReels();}
  });
  const adForm=$('n5AdForm');
  if(adForm)adForm.addEventListener('submit',async e=>{
    e.preventDefault();
    const button=$('n5AdPublish'),message=$('n5AdMessage'),file=$('n5AdImage').files[0];
    if(!file){message.textContent='कृपया विज्ञापन की इमेज चुनें।';return;}
    if(file.size>2_500_000){message.textContent='इमेज 2.5 MB से छोटी रखें।';return;}
    button.disabled=true;message.textContent='विज्ञापन अपलोड हो रहा है...';
    try{
      const imageData=await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('इमेज पढ़ी नहीं जा सकी।'));reader.readAsDataURL(file);
      });
      await api('/api/advertisements',{method:'POST',body:JSON.stringify({
        slotNo:Number($('n5AdSlot').value),title:$('n5AdTitle').value.trim(),sponsor:$('n5AdSponsor').value.trim(),
        clickUrl:$('n5AdLink').value.trim(),imageData
      })});
      const savedSlot=$('n5AdSlot').value;
      adForm.reset();$('n5AdSlot').value=savedSlot;
      message.textContent='Ad Slot '+savedSlot+' का विज्ञापन सेव हो गया!';
      await loadAdvertisement();await loadAdminAdvertisement();
    }catch(err){message.textContent=err.message;}finally{button.disabled=false;}
  });
  $('n5ReelForm').addEventListener('submit',async e=>{
    e.preventDefault();const btn=$('n5ReelPublish'),msg=$('n5ReelMessage');btn.disabled=true;msg.textContent='रील पब्लिश हो रही है...';
    try{
      await api('/api/reels',{method:'POST',body:JSON.stringify({title:$('n5ReelTitle').value,description:$('n5ReelDescription').value,videoUrl:$('n5ReelVideo').value,thumbnailUrl:$('n5ReelThumbnail').value,category:$('n5ReelCategory').value})});
      $('n5ReelForm').reset();msg.textContent='रील सफलतापूर्वक पब्लिश हो गई!';await loadReels();
    }catch(err){msg.textContent=err.message;}finally{btn.disabled=false;}
  });
  loadAdvertisement();
  api('/api/auth/me').then(result=>{renderUser(result.authenticated?result.user:null);loadReels();}).catch(()=>{renderUser(null);loadReels();});
})();
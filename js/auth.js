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
    const legacy=$('openAddInstaModalBtn');
    if(legacy)legacy.hidden=!(user&&user.role==='admin');
  }
  async function api(url,options={}){
    const res=await fetch(url,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'Request असफल रहा।');
    return data;
  }
  async function loadReels(){
    const grid=$('n5ReelsGrid');if(!grid)return;
    try{
      const data=await api('/api/reels');
      grid.replaceChildren();
      if(!data.reels.length){grid.textContent='अभी कोई रील प्रकाशित नहीं हुई है।';return;}
      data.reels.forEach(reel=>{
        const card=document.createElement('article');card.className='n5-reel-card';
        let media;
        if(/\.mp4($|\?)/i.test(reel.video_url)){
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
        if(user&&user.role==='admin'){
          const del=document.createElement('button');del.type='button';del.textContent='रील हटाएं';del.className='n5-account-btn';
          del.addEventListener('click',async()=>{if(!confirm('क्या आप यह रील हटाना चाहते हैं?'))return;try{await api('/api/reels/'+reel.id,{method:'DELETE'});loadReels();}catch(e){alert(e.message);}});
          copy.append(del);
        }
        card.append(copy);grid.append(card);
      });
    }catch(e){grid.textContent='रील्स लोड नहीं हो पाईं।';}
  }
  account.addEventListener('click',()=>user?$('n5AdminPanel').scrollIntoView({behavior:'smooth'}):(backdrop.hidden=false,setMode('login')));
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
  $('n5ReelForm').addEventListener('submit',async e=>{
    e.preventDefault();const btn=$('n5ReelPublish'),msg=$('n5ReelMessage');btn.disabled=true;msg.textContent='रील पब्लिश हो रही है...';
    try{
      await api('/api/reels',{method:'POST',body:JSON.stringify({title:$('n5ReelTitle').value,description:$('n5ReelDescription').value,videoUrl:$('n5ReelVideo').value,thumbnailUrl:$('n5ReelThumbnail').value,category:$('n5ReelCategory').value})});
      $('n5ReelForm').reset();msg.textContent='रील सफलतापूर्वक पब्लिश हो गई!';await loadReels();
    }catch(err){msg.textContent=err.message;}finally{btn.disabled=false;}
  });
  api('/api/auth/me').then(result=>{renderUser(result.authenticated?result.user:null);loadReels();}).catch(()=>{renderUser(null);loadReels();});
})();
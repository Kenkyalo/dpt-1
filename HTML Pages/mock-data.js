// mock-data.js — SME Data Simulator
// Include in connect-platforms.html for demo/evaluation mode
// Shows a floating "Simulate SME" button that auto-fills all platform data

const SME_PROFILES = [
  {
    name: "Amina's Fashion Boutique",
    sector: "Fashion",
    location: "Nairobi",
    facebook:  { posts: 14, interactions: 420, responseTime: 1.5, profileComplete: 0.9 },
    instagram: { posts: 20, interactions: 680, responseTime: 2,   profileComplete: 0.85 },
    google:    { profileComplete: 0.8 },
    whatsapp:  { responseTime: 1, messages: 25, postsPerWeek: 6, profileComplete: 1 },
    website:   { url: 'https://aminafashion.co.ke', visitors: 520, posts: 4, contact: 1 },
    label: "🛍️ High Performer — Fashion",
  },
  {
    name: "Karibu Café & Restaurant",
    sector: "Food & Beverage",
    location: "Mombasa",
    facebook:  { posts: 8,  interactions: 190, responseTime: 4,  profileComplete: 0.7 },
    instagram: { posts: 12, interactions: 310, responseTime: 5,  profileComplete: 0.7 },
    google:    { profileComplete: 0.6 },
    whatsapp:  { responseTime: 3, messages: 18, postsPerWeek: 3, profileComplete: 1 },
    website:   { url: '', visitors: 120, posts: 1, contact: 1 },
    label: "☕ Average — Food & Beverage",
  },
  {
    name: "TechFix Solutions",
    sector: "Technology",
    location: "Nairobi",
    facebook:  { posts: 3,  interactions: 45,  responseTime: 8,  profileComplete: 0.5 },
    instagram: { posts: 2,  interactions: 30,  responseTime: 12, profileComplete: 0.4 },
    google:    { profileComplete: 0.3 },
    whatsapp:  { responseTime: 6, messages: 8, postsPerWeek: 1, profileComplete: 0 },
    website:   { url: '', visitors: 60, posts: 0, contact: 0 },
    label: "💻 Low Performer — Tech",
  },
  {
    name: "Mama Pima Health Clinic",
    sector: "Healthcare",
    location: "Kisumu",
    facebook:  { posts: 6,  interactions: 95,  responseTime: 2,  profileComplete: 0.85 },
    instagram: { posts: 4,  interactions: 55,  responseTime: 3,  profileComplete: 0.75 },
    google:    { profileComplete: 0.9 },
    whatsapp:  { responseTime: 1.5, messages: 30, postsPerWeek: 4, profileComplete: 1 },
    website:   { url: 'https://mamapima.co.ke', visitors: 280, posts: 2, contact: 1 },
    label: "🏥 Strong Profile — Healthcare",
  },
  {
    name: "Zawadi Gifts & Events",
    sector: "Retail",
    location: "Nakuru",
    facebook:  { posts: 18, interactions: 560, responseTime: 0.5, profileComplete: 0.95 },
    instagram: { posts: 25, interactions: 890, responseTime: 1,   profileComplete: 0.9  },
    google:    { profileComplete: 0.7 },
    whatsapp:  { responseTime: 0.5, messages: 40, postsPerWeek: 7, profileComplete: 1 },
    website:   { url: 'https://zawadike.com', visitors: 750, posts: 6, contact: 1 },
    label: "🎁 Top Performer — Retail",
  },
];

let mockIndex = 0;

function injectMockData(profileIndex) {
  const sme = SME_PROFILES[profileIndex !== undefined ? profileIndex : mockIndex];

  // Inject WhatsApp data
  const waResp = document.getElementById('wa-response');
  const waMsg  = document.getElementById('wa-messages');
  const waPosts= document.getElementById('wa-posts');
  const waPro  = document.getElementById('wa-profile');
  if (waResp)  waResp.value  = sme.whatsapp.responseTime;
  if (waMsg)   waMsg.value   = sme.whatsapp.messages;
  if (waPosts) waPosts.value = sme.whatsapp.postsPerWeek;
  if (waPro)   waPro.value   = sme.whatsapp.profileComplete;

  // Inject website data
  const webUrl  = document.getElementById('web-url');
  const webVis  = document.getElementById('web-visitors');
  const webPost = document.getElementById('web-posts');
  const webCon  = document.getElementById('web-contact');
  if (webUrl)  webUrl.value  = sme.website.url;
  if (webVis)  webVis.value  = sme.website.visitors;
  if (webPost) webPost.value = sme.website.posts;
  if (webCon)  webCon.value  = sme.website.contact;

  // Inject into platformData global (used by computeAndSave)
  if (typeof platformData !== 'undefined') {
    platformData.facebook = {
      posts:           sme.facebook.posts,
      interactions:    sme.facebook.interactions,
      responseTime:    sme.facebook.responseTime,
      profileComplete: sme.facebook.profileComplete,
    };
    platformData.instagram = {
      posts:           sme.instagram.posts,
      interactions:    sme.instagram.interactions,
      responseTime:    sme.instagram.responseTime,
      profileComplete: sme.instagram.profileComplete,
    };
    platformData.google = {
      profileComplete: sme.google.profileComplete,
      posts: 2,
    };
    platformData.whatsapp = {
      responseTime:    sme.whatsapp.responseTime,
      messages:        sme.whatsapp.messages,
      postsPerWeek:    sme.whatsapp.postsPerWeek,
      profileComplete: sme.whatsapp.profileComplete,
    };
    platformData.website = {
      url:      sme.website.url,
      visitors: sme.website.visitors,
      posts:    sme.website.posts,
      contact:  sme.website.contact,
    };

    // Mark all platforms as connected for scoring
    if (typeof connectedList !== 'undefined') {
      connectedList = ['facebook', 'instagram', 'google'];
    }
  }

  // Show preview of what was injected
  showMockToast(sme);

  // Cycle to next profile
  mockIndex = (mockIndex + 1) % SME_PROFILES.length;
}

function showMockToast(sme) {
  // Remove existing mock toast
  document.getElementById('mock-toast')?.remove();

  const toast = document.createElement('div');
  toast.id    = 'mock-toast';
  toast.style.cssText = `
    position:fixed;bottom:90px;right:24px;background:#1e293b;color:#fff;
    padding:14px 18px;border-radius:12px;font-family:'DM Sans',sans-serif;
    font-size:13px;max-width:300px;box-shadow:0 8px 24px rgba(0,0,0,.25);
    z-index:9999;animation:slideUp .3s ease;
  `;
  toast.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px;">${sme.label}</div>
    <div style="font-size:12px;opacity:.75;margin-bottom:8px;">${sme.name} · ${sme.location}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;opacity:.7;">
      <span>📘 FB Posts: ${sme.facebook.posts}</span>
      <span>📸 IG Posts: ${sme.instagram.posts}</span>
      <span>💬 WA Resp: ${sme.whatsapp.responseTime}h</span>
      <span>🌐 Visitors: ${sme.website.visitors}/mo</span>
    </div>
    <div style="margin-top:10px;font-size:11px;opacity:.55;">Data injected. Click Compute Score →</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function renderMockFAB() {
  // Don't add twice
  if (document.getElementById('mock-fab')) return;

  // Add keyframe animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp { from { transform:translateY(20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
    @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)} 50%{box-shadow:0 0 0 8px rgba(37,99,235,0)} }
    #mock-fab { animation: pulse 2.5s infinite; }
    #mock-menu { display:none; }
    #mock-menu.open { display:flex; }
  `;
  document.head.appendChild(style);

  const fab = document.createElement('div');
  fab.id    = 'mock-fab';
  fab.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9998;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;
    border-radius:50px;padding:12px 20px;cursor:pointer;
    font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;
    box-shadow:0 4px 20px rgba(37,99,235,.45);
    display:flex;align-items:center;gap:8px;user-select:none;
    transition:transform .2s;
  `;
  fab.innerHTML = `<span style="font-size:16px;">🎭</span> Simulate SME`;
  fab.onmouseenter = () => fab.style.transform = 'scale(1.05)';
  fab.onmouseleave = () => fab.style.transform = 'scale(1)';
  fab.onclick = () => toggleMockMenu();
  document.body.appendChild(fab);

  // Profile selector menu
  const menu = document.createElement('div');
  menu.id    = 'mock-menu';
  menu.style.cssText = `
    position:fixed;bottom:80px;right:24px;z-index:9997;
    background:#fff;border-radius:16px;padding:8px;
    box-shadow:0 8px 40px rgba(0,0,0,.15);border:1.5px solid #e2e8f0;
    flex-direction:column;gap:4px;min-width:260px;
  `;
  SME_PROFILES.forEach((sme, i) => {
    const item = document.createElement('button');
    item.style.cssText = `
      display:flex;align-items:center;gap:10px;padding:10px 14px;
      border-radius:10px;border:none;background:transparent;cursor:pointer;
      font-family:'DM Sans',sans-serif;font-size:13px;text-align:left;width:100%;
      transition:background .15s;
    `;
    item.innerHTML = `<span style="font-size:16px;">${sme.label.split(' ')[0]}</span><div><div style="font-weight:600;color:#0f1f3d;">${sme.name}</div><div style="font-size:11px;color:#64748b;">${sme.sector} · ${sme.location}</div></div>`;
    item.onmouseenter = () => item.style.background = '#f8fafc';
    item.onmouseleave = () => item.style.background = 'transparent';
    item.onclick = () => { injectMockData(i); closeMockMenu(); };
    menu.appendChild(item);
  });

  // Random option
  const randItem = document.createElement('button');
  randItem.style.cssText = `
    display:flex;align-items:center;gap:10px;padding:10px 14px;margin-top:4px;
    border-radius:10px;border:1.5px dashed #e2e8f0;background:transparent;cursor:pointer;
    font-family:'DM Sans',sans-serif;font-size:13px;text-align:left;width:100%;
    transition:all .15s;color:#64748b;
  `;
  randItem.innerHTML = `<span style="font-size:16px;">🎲</span><div style="font-weight:600;">Random SME</div>`;
  randItem.onmouseenter = () => { randItem.style.background='#f8fafc'; randItem.style.borderColor='#2563eb'; };
  randItem.onmouseleave = () => { randItem.style.background='transparent'; randItem.style.borderColor='#e2e8f0'; };
  randItem.onclick = () => { injectMockData(Math.floor(Math.random() * SME_PROFILES.length)); closeMockMenu(); };
  menu.appendChild(randItem);
  document.body.appendChild(menu);

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target) && !menu.contains(e.target)) closeMockMenu();
  });
}

function toggleMockMenu() {
  const menu = document.getElementById('mock-menu');
  menu.classList.toggle('open');
}
function closeMockMenu() {
  document.getElementById('mock-menu')?.classList.remove('open');
}

// Auto-render FAB when script is loaded
document.addEventListener('DOMContentLoaded', renderMockFAB);
// Also try immediately in case DOM is already ready
if (document.readyState !== 'loading') renderMockFAB();

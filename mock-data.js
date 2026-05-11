// mock-data.js — SME Data Simulator
// Include in connect-platforms.html for demo/evaluation mode.
// Shows a floating "Simulate SME" button that generates an AI profile
// using Gemini (free tier, separate from Groq which handles recommendations).
// Falls back to hardcoded profiles if Gemini is unavailable or slow.

// ── SIMULATION MODE FLAG ────────────────────────────────────────────────
let isSimulating = false;  // ← ADD THIS LINE

// ── FALLBACK PROFILES (used if Gemini fails or is rate-limited) ──────────────
const SME_PROFILES = [
  {
    name: "Amina's Fashion Boutique",
    sector: "Fashion", location: "Nairobi",
    facebook:  { posts: 14, interactions: 420, responseTime: 1.5, profileComplete: 0.9 },
    instagram: { posts: 20, interactions: 680, responseTime: 2,   profileComplete: 0.85 },
    google:    { profileComplete: 0.8 },
    whatsapp:  { responseTime: 1,   messages: 25, postsPerWeek: 6, profileComplete: 1 },
    website:   { url: 'https://aminafashion.co.ke', visitors: 520, posts: 4, contact: 1 },
    label: "🛍️ High Performer — Fashion",
  },
  {
    name: "Karibu Café & Restaurant",
    sector: "Food & Beverage", location: "Mombasa",
    facebook:  { posts: 8,  interactions: 190, responseTime: 4,  profileComplete: 0.7 },
    instagram: { posts: 12, interactions: 310, responseTime: 5,  profileComplete: 0.7 },
    google:    { profileComplete: 0.6 },
    whatsapp:  { responseTime: 3,   messages: 18, postsPerWeek: 3, profileComplete: 1 },
    website:   { url: '', visitors: 120, posts: 1, contact: 1 },
    label: "☕ Average — Food & Beverage",
  },
  {
    name: "TechFix Solutions",
    sector: "Technology", location: "Nairobi",
    facebook:  { posts: 3,  interactions: 45,  responseTime: 8,  profileComplete: 0.5 },
    instagram: { posts: 2,  interactions: 30,  responseTime: 12, profileComplete: 0.4 },
    google:    { profileComplete: 0.3 },
    whatsapp:  { responseTime: 6,   messages: 8,  postsPerWeek: 1, profileComplete: 0 },
    website:   { url: '', visitors: 60, posts: 0, contact: 0 },
    label: "💻 Low Performer — Tech",
  },
  {
    name: "Mama Pima Health Clinic",
    sector: "Healthcare", location: "Kisumu",
    facebook:  { posts: 6,  interactions: 95,  responseTime: 2,  profileComplete: 0.85 },
    instagram: { posts: 4,  interactions: 55,  responseTime: 3,  profileComplete: 0.75 },
    google:    { profileComplete: 0.9 },
    whatsapp:  { responseTime: 1.5, messages: 30, postsPerWeek: 4, profileComplete: 1 },
    website:   { url: 'https://mamapima.co.ke', visitors: 280, posts: 2, contact: 1 },
    label: "🏥 Strong Profile — Healthcare",
  },
  {
    name: "Zawadi Gifts & Events",
    sector: "Retail", location: "Nakuru",
    facebook:  { posts: 18, interactions: 560, responseTime: 0.5, profileComplete: 0.95 },
    instagram: { posts: 25, interactions: 890, responseTime: 1,   profileComplete: 0.9  },
    google:    { profileComplete: 0.7 },
    whatsapp:  { responseTime: 0.5, messages: 40, postsPerWeek: 7, profileComplete: 1 },
    website:   { url: 'https://zawadike.com', visitors: 750, posts: 6, contact: 1 },
    label: "🎁 Top Performer — Retail",
  },
];

let mockIndex        = 0;
let geminiCooldown   = false;   // Rate-limit flag — 30s cooldown between Gemini calls
let lastGeminiProfile = null;   // Cache — reuse if called again within 5 minutes
let lastGeminiTime    = 0;      // Timestamp of last successful Gemini call

// ── GEMINI PROFILE GENERATOR ─────────────────────────────────────────────────
async function generateGeminiProfile() {
  // Check rate-limit cooldown only (30s between calls to avoid quota abuse)
  // No longer caching — each call should produce a fresh diverse profile
  if (geminiCooldown) {
    console.log('[mock] Gemini on cooldown, using fallback');
    return null;
  }

  // Get the current user's sector and location from Supabase session
  // so the generated profile matches their business type
  let sector = 'Retail', location = 'Nairobi';
  try {
    const { data } = await sb.auth.getSession();
    if (data?.session?.user?.user_metadata) {
      sector   = data.session.user.user_metadata.sector   || sector;
      location = data.session.user.user_metadata.location || location;
    }
  } catch (_) {}

  // Start cooldown — regardless of success/failure, wait 30s before next call
  geminiCooldown = true;
  setTimeout(() => { geminiCooldown = false; }, 30000);

  // Random seed forces Gemini to generate a different profile each time
  const seed = Math.floor(Math.random() * 9999);
  const performanceLevels = ['a struggling low-performing', 'a below-average', 'an average', 'a growing', 'a strong high-performing'];
  const perfLevel = performanceLevels[Math.floor(Math.random() * performanceLevels.length)];

  const prompt = `Generate a realistic Kenyan SME digital presence dataset for ${perfLevel} ${sector} business in ${location}. (seed:${seed})
Return ONLY a valid JSON object with NO extra text, markdown, or explanation. Use this exact structure:
{
  "name": "Business Name",
  "sector": "${sector}",
  "location": "${location}",
  "label": "emoji Performance Level — ${sector}",
  "facebook":  { "posts": 0, "interactions": 0, "responseTime": 0.0, "profileComplete": 0.0 },
  "instagram": { "posts": 0, "interactions": 0, "responseTime": 0.0, "profileComplete": 0.0 },
  "google":    { "profileComplete": 0.0 },
  "whatsapp":  { "responseTime": 0.0, "messages": 0, "postsPerWeek": 0, "profileComplete": 0.0 },
  "website":   { "url": "", "visitors": 0, "posts": 0, "contact": 0 }
}
Rules:
- posts: integer 1-30, interactions: integer 10-1000, responseTime: float 0.5-24 (hours)
- profileComplete: float 0.0-1.0, visitors: integer 50-1000, contact: 0 or 1
- Performance level MUST match "${perfLevel}" — vary numbers significantly
- Low performer: high response times (8-24h), few posts (1-4), low interactions (10-80)
- High performer: low response times (0.5-2h), many posts (15-30), high interactions (500-1000)
- The business name must sound authentically Kenyan and different each time
- label format: "emoji Performance — Sector" e.g. "🏪 Growing — Retail"`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 500 },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

    const json    = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any accidental markdown fences Gemini might add
    const clean = rawText.replace(/```json|```/gi, '').trim();
    const profile = JSON.parse(clean);

    // Validate required fields exist before trusting the response
    if (!profile.facebook || !profile.instagram || !profile.whatsapp || !profile.website) {
      throw new Error('Gemini response missing required fields');
    }

    // Cache it
    lastGeminiProfile = profile;
    lastGeminiTime    = Date.now();
    console.log('[mock] Gemini profile generated:', profile.name);
    return profile;

  } catch (err) {
    console.warn('[mock] Gemini failed, will use fallback:', err.message);
    return null;
  }
}

// ── INJECT DATA INTO PAGE + TRIGGER SCORE COMPUTATION ────────────────────────
function injectMockData(sme) {
  // Set simulation flag to TRUE before filling data
  isSimulating = true;  // ← ADD THIS LINE
  
  // Fill WhatsApp form fields
  const waResp  = document.getElementById('wa-response');
  const waMsg   = document.getElementById('wa-messages');
  const waPosts = document.getElementById('wa-posts');
  const waPro   = document.getElementById('wa-profile');
  if (waResp)  waResp.value  = sme.whatsapp.responseTime;
  if (waMsg)   waMsg.value   = sme.whatsapp.messages;
  if (waPosts) waPosts.value = sme.whatsapp.postsPerWeek;
  if (waPro)   waPro.value   = sme.whatsapp.profileComplete;

  // Fill website form fields
  const webUrl  = document.getElementById('web-url');
  const webVis  = document.getElementById('web-visitors');
  const webPost = document.getElementById('web-posts');
  const webCon  = document.getElementById('web-contact');
  if (webUrl)  webUrl.value  = sme.website.url;
  if (webVis)  webVis.value  = sme.website.visitors;
  if (webPost) webPost.value = sme.website.posts;
  if (webCon)  webCon.value  = sme.website.contact;

  // Push into platformData global so computeAndSave() picks it up
  if (typeof platformData !== 'undefined') {
    platformData.facebook  = { posts: sme.facebook.posts, interactions: sme.facebook.interactions, responseTime: sme.facebook.responseTime, profileComplete: sme.facebook.profileComplete };
    platformData.instagram = { posts: sme.instagram.posts, interactions: sme.instagram.interactions, responseTime: sme.instagram.responseTime, profileComplete: sme.instagram.profileComplete };
    platformData.google    = { profileComplete: sme.google.profileComplete, posts: 2 };
    platformData.whatsapp  = { responseTime: sme.whatsapp.responseTime, messages: sme.whatsapp.messages, postsPerWeek: sme.whatsapp.postsPerWeek, profileComplete: sme.whatsapp.profileComplete };
    platformData.website   = { url: sme.website.url, visitors: sme.website.visitors, posts: sme.website.posts, contact: sme.website.contact };
    if (typeof connectedList !== 'undefined') connectedList = ['facebook', 'instagram', 'google'];
  }

  // Show toast with the injected profile summary
  showMockToast(sme);

  // Auto-compute after 1500ms
  if (typeof computeAndSave === 'function') {
    setTimeout(() => {
      computeAndSave();
      // Reset simulation flag after compute is done
      setTimeout(() => { isSimulating = false; }, 2000);  // ← ADD THIS LINE
    }, 1500);
  }
}

// ── MAIN ENTRY — called when user picks a profile from the menu ───────────────
async function runSimulation(profileIndex) {
  closeMockMenu();
  showLoadingToast();

  let sme = null;

  // Try Gemini first (unless a specific fallback index was chosen)
  if (profileIndex === undefined || profileIndex === null) {
    sme = await generateGeminiProfile();
  }

  // Fall back to hardcoded profiles if Gemini failed or a specific one was picked
  if (!sme) {
    const idx = profileIndex !== undefined && profileIndex !== null
      ? profileIndex
      : (mockIndex % SME_PROFILES.length);
    sme = SME_PROFILES[idx];
    mockIndex++;
  }

  injectMockData(sme);
}

// ── TOASTS ────────────────────────────────────────────────────────────────────
function showLoadingToast() {
  document.getElementById('mock-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'mock-toast';
  toast.style.cssText = `
    position:fixed;bottom:90px;right:24px;background:#1e293b;color:#fff;
    padding:14px 18px;border-radius:12px;font-family:'DM Sans',sans-serif;
    font-size:13px;max-width:300px;box-shadow:0 8px 24px rgba(0,0,0,.25);
    z-index:9999;animation:slideUp .3s ease;
  `;
  toast.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px;">✨ Generating AI Profile...</div>
    <div style="font-size:12px;opacity:.7;">Gemini is creating a realistic ${getUserSector()} business profile for you.</div>
  `;
  document.body.appendChild(toast);
}

function showMockToast(sme) {
  document.getElementById('mock-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'mock-toast';
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
    <div style="margin-top:10px;font-size:11px;opacity:.55;">Computing your LDVS score...</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// Helper — gets sector from auth metadata for the loading toast label
function getUserSector() {
  try {
    // This is sync so we use whatever was last cached in the session
    const meta = window._mockUserMeta;
    return meta?.sector || 'SME';
  } catch (_) { return 'SME'; }
}

// ── FAB + MENU ────────────────────────────────────────────────────────────────
function renderMockFAB() {
  if (document.getElementById('mock-fab')) return;

  // Cache user metadata for the loading toast
  sb.auth.getSession().then(({ data }) => {
    if (data?.session?.user?.user_metadata) {
      window._mockUserMeta = data.session.user.user_metadata;
    }
  });

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
  fab.id = 'mock-fab';
  fab.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9998;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;
    border-radius:50px;padding:12px 20px;cursor:pointer;
    font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;
    box-shadow:0 4px 20px rgba(37,99,235,.45);
    display:flex;align-items:center;gap:8px;user-select:none;transition:transform .2s;
  `;
  fab.innerHTML = `<span style="font-size:16px;">🎭</span> Simulate SME`;
  fab.onmouseenter = () => fab.style.transform = 'scale(1.05)';
  fab.onmouseleave = () => fab.style.transform = 'scale(1)';
  fab.onclick = () => toggleMockMenu();
  document.body.appendChild(fab);

  const menu = document.createElement('div');
  menu.id = 'mock-menu';
  menu.style.cssText = `
    position:fixed;bottom:80px;right:24px;z-index:9997;
    background:#fff;border-radius:16px;padding:8px;
    box-shadow:0 8px 40px rgba(0,0,0,.15);border:1.5px solid #e2e8f0;
    flex-direction:column;gap:4px;min-width:270px;
  `;

  // AI Generate option — appears at the top, calls Gemini
  const aiItem = document.createElement('button');
  aiItem.style.cssText = `
    display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:4px;
    border-radius:10px;border:1.5px solid #2563eb;background:#eff6ff;cursor:pointer;
    font-family:'DM Sans',sans-serif;font-size:13px;text-align:left;width:100%;
    transition:all .15s;
  `;
  aiItem.innerHTML = `<span style="font-size:16px;">✨</span><div><div style="font-weight:700;color:#1d4ed8;">AI Generate Profile</div><div style="font-size:11px;color:#3b82f6;">Gemini creates a profile for your sector</div></div>`;
  aiItem.onmouseenter = () => aiItem.style.background = '#dbeafe';
  aiItem.onmouseleave = () => aiItem.style.background = '#eff6ff';
  aiItem.onclick = () => runSimulation(null);
  menu.appendChild(aiItem);

  // Divider
  const divider = document.createElement('div');
  divider.style.cssText = 'font-size:10px;color:#94a3b8;font-weight:600;padding:4px 14px;text-transform:uppercase;letter-spacing:.5px;';
  divider.textContent = 'Or pick a preset';
  menu.appendChild(divider);

  // Hardcoded fallback profiles
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
    item.onclick = () => runSimulation(i);
    menu.appendChild(item);
  });

  // Random fallback option
  const randItem = document.createElement('button');
  randItem.style.cssText = `
    display:flex;align-items:center;gap:10px;padding:10px 14px;margin-top:4px;
    border-radius:10px;border:1.5px dashed #e2e8f0;background:transparent;cursor:pointer;
    font-family:'DM Sans',sans-serif;font-size:13px;text-align:left;width:100%;
    transition:all .15s;color:#64748b;
  `;
  randItem.innerHTML = `<span style="font-size:16px;">🎲</span><div style="font-weight:600;">Random Preset</div>`;
  randItem.onmouseenter = () => { randItem.style.background='#f8fafc'; randItem.style.borderColor='#2563eb'; };
  randItem.onmouseleave = () => { randItem.style.background='transparent'; randItem.style.borderColor='#e2e8f0'; };
  randItem.onclick = () => runSimulation(Math.floor(Math.random() * SME_PROFILES.length));
  menu.appendChild(randItem);

  document.body.appendChild(menu);

  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target) && !menu.contains(e.target)) closeMockMenu();
  });
}

function toggleMockMenu() { document.getElementById('mock-menu')?.classList.toggle('open'); }
function closeMockMenu()  { document.getElementById('mock-menu')?.classList.remove('open'); }

// Auto-render FAB when script is loaded
document.addEventListener('DOMContentLoaded', renderMockFAB);
if (document.readyState !== 'loading') renderMockFAB();
// mock-data.js — SME Data Simulator
// Include in connect-platforms.html for demo/evaluation mode.
// Shows a floating "Simulate SME" button that generates an AI profile
// using Gemini (free tier, separate from Groq which handles recommendations).
// Falls back to hardcoded profiles if Gemini is unavailable or slow.

// ── FALLBACK PROFILES (used if Gemini fails or is rate-limited) ──────────────
const SME_PROFILES = [
  {
    name: "Amina's Fashion Boutique",
    sector: "Fashion", location: "Nairobi",
    facebook:  { posts: 14, interactions: 420, responseTime: 1.5, profileComplete: 0.9 },
    instagram: { posts: 20, interactions: 680, responseTime: 2,   profileComplete: 0.85 },
    google:    { profileComplete: 0.8, hasKnowledgePanel: true, rating: 4.2, reviews: 47 },
    whatsapp:  { responseTime: 1,   messages: 25, postsPerWeek: 6, profileComplete: 1 },
    website:   { url: 'https://aminafashion.co.ke', visitors: 520, posts: 4, contact: 1, pagespeedScore: 78 },
    telegram:  { username: "amina_fashion", subscribers: 340, hasPhoto: true },
    label: "🛍️ High Performer — Fashion",
  },
  {
    name: "Karibu Café & Restaurant",
    sector: "Food & Beverage", location: "Mombasa",
    facebook:  { posts: 8,  interactions: 190, responseTime: 4,  profileComplete: 0.7 },
    instagram: { posts: 12, interactions: 310, responseTime: 5,  profileComplete: 0.7 },
    google:    { profileComplete: 0.6, hasKnowledgePanel: false, rating: 3.5, reviews: 23 },
    whatsapp:  { responseTime: 3,   messages: 18, postsPerWeek: 3, profileComplete: 1 },
    website:   { url: '', visitors: 120, posts: 1, contact: 1, pagespeedScore: 0 },
    telegram:  { username: "", subscribers: 0, hasPhoto: false },
    label: "☕ Average — Food & Beverage",
  },
  {
    name: "TechFix Solutions",
    sector: "Technology", location: "Nairobi",
    facebook:  { posts: 3,  interactions: 45,  responseTime: 8,  profileComplete: 0.5 },
    instagram: { posts: 2,  interactions: 30,  responseTime: 12, profileComplete: 0.4 },
    google:    { profileComplete: 0.3, hasKnowledgePanel: false, rating: 0, reviews: 0 },
    whatsapp:  { responseTime: 6,   messages: 8,  postsPerWeek: 1, profileComplete: 0 },
    website:   { url: '', visitors: 60, posts: 0, contact: 0, pagespeedScore: 0 },
    telegram:  { username: "", subscribers: 0, hasPhoto: false },
    label: "💻 Low Performer — Tech",
  },
  {
    name: "Mama Pima Health Clinic",
    sector: "Healthcare", location: "Kisumu",
    facebook:  { posts: 6,  interactions: 95,  responseTime: 2,  profileComplete: 0.85 },
    instagram: { posts: 4,  interactions: 55,  responseTime: 3,  profileComplete: 0.75 },
    google:    { profileComplete: 0.9, hasKnowledgePanel: true, rating: 4.5, reviews: 32 },
    whatsapp:  { responseTime: 1.5, messages: 30, postsPerWeek: 4, profileComplete: 1 },
    website:   { url: 'https://mamapima.co.ke', visitors: 280, posts: 2, contact: 1, pagespeedScore: 65 },
    telegram:  { username: "mamapima_health", subscribers: 120, hasPhoto: true },
    label: "🏥 Strong Profile — Healthcare",
  },
  {
    name: "Zawadi Gifts & Events",
    sector: "Retail", location: "Nakuru",
    facebook:  { posts: 18, interactions: 560, responseTime: 0.5, profileComplete: 0.95 },
    instagram: { posts: 25, interactions: 890, responseTime: 1,   profileComplete: 0.9  },
    google:    { profileComplete: 0.7, hasKnowledgePanel: true, rating: 4.8, reviews: 156 },
    whatsapp:  { responseTime: 0.5, messages: 40, postsPerWeek: 7, profileComplete: 1 },
    website:   { url: 'https://zawadike.com', visitors: 750, posts: 6, contact: 1, pagespeedScore: 82 },
    telegram:  { username: "zawadi_gifts", subscribers: 890, hasPhoto: true },
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
  "google":    { "profileComplete": 0.0, "hasKnowledgePanel": false, "rating": 0.0, "reviews": 0 },
  "whatsapp":  { "responseTime": 0.0, "messages": 0, "postsPerWeek": 0, "profileComplete": 0.0 },
  "website":   { "url": "", "visitors": 0, "posts": 0, "contact": 0, "pagespeedScore": 0 },
  "telegram":  { "username": "", "subscribers": 0, "hasPhoto": false }
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
    if (!profile.facebook || !profile.instagram || !profile.whatsapp || !profile.website || !profile.telegram) {
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

// ── INDEPENDENT SCORE CALCULATION (No External APIs) ──────────────────────
function calculateIndependentScore(sme) {
  let scores = {
    profile: 0,
    engagement: 0,
    presence: 0,
    posting: 0,
    responsiveness: 0
  };
  
  // 1. PROFILE SCORE (25% weight)
  let profileTotal = 0;
  let profileMax = 0;
  
  if (sme.facebook) {
    profileTotal += sme.facebook.profileComplete * 25;
    profileMax += 25;
  }
  if (sme.instagram) {
    profileTotal += sme.instagram.profileComplete * 25;
    profileMax += 25;
  }
  if (sme.google) {
    profileTotal += sme.google.profileComplete * 25;
    profileMax += 25;
  }
  if (sme.whatsapp && sme.whatsapp.profileComplete !== undefined) {
    profileTotal += sme.whatsapp.profileComplete * 15;
    profileMax += 15;
  }
  if (sme.telegram) {
    profileTotal += (sme.telegram.hasPhoto ? 0.8 : 0.3) * 10;
    profileMax += 10;
  }
  scores.profile = profileMax > 0 ? (profileTotal / profileMax) * 100 : 0;
  
  // 2. ENGAGEMENT SCORE (30% weight)
  let engagementTotal = 0;
  let engagementMax = 0;
  
  if (sme.facebook) {
    const fbEngagement = Math.min(100, (sme.facebook.interactions / 500) * 100);
    engagementTotal += fbEngagement * 20;
    engagementMax += 20;
  }
  if (sme.instagram) {
    const igEngagement = Math.min(100, (sme.instagram.interactions / 600) * 100);
    engagementTotal += igEngagement * 20;
    engagementMax += 20;
  }
  if (sme.google && sme.google.reviews) {
    const reviewScore = Math.min(100, (sme.google.reviews / 100) * 100);
    const ratingScore = sme.google.rating ? (sme.google.rating / 5) * 100 : 0;
    const googleEngagement = (reviewScore * 0.6) + (ratingScore * 0.4);
    engagementTotal += googleEngagement * 30;
    engagementMax += 30;
  }
  if (sme.telegram && sme.telegram.subscribers) {
    let telegramScore = 0;
    if (sme.telegram.subscribers >= 1000) telegramScore = 100;
    else if (sme.telegram.subscribers >= 500) telegramScore = 80;
    else if (sme.telegram.subscribers >= 100) telegramScore = 60;
    else if (sme.telegram.subscribers >= 50) telegramScore = 40;
    else if (sme.telegram.subscribers >= 10) telegramScore = 20;
    else telegramScore = 10;
    engagementTotal += telegramScore * 30;
    engagementMax += 30;
  }
  scores.engagement = engagementMax > 0 ? (engagementTotal / engagementMax) * 100 : 0;
  
  // 3. PRESENCE SCORE (25% weight)
  let presenceTotal = 0;
  let presenceMax = 0;
  
  if (sme.google && sme.google.hasKnowledgePanel) {
    presenceTotal += 40;
  } else if (sme.google && sme.google.profileComplete > 0.5) {
    presenceTotal += 20;
  }
  presenceMax += 40;
  
  if (sme.website && sme.website.pagespeedScore && sme.website.pagespeedScore > 0) {
    presenceTotal += sme.website.pagespeedScore * 0.6;
    presenceMax += 60;
  } else if (sme.website && sme.website.url) {
    presenceTotal += 30;
    presenceMax += 60;
  } else {
    presenceMax += 60;
  }
  scores.presence = presenceMax > 0 ? (presenceTotal / presenceMax) * 100 : 0;
  
  // 4. POSTING SCORE (10% weight)
  let postingTotal = 0;
  let postingMax = 0;
  const totalPosts = (sme.facebook?.posts || 0) + (sme.instagram?.posts || 0) + (sme.whatsapp?.postsPerWeek || 0) * 4 + (sme.website?.posts || 0);
  const postingScore = Math.min(100, (totalPosts / 30) * 100);
  postingTotal += postingScore * 100;
  postingMax += 100;
  scores.posting = postingMax > 0 ? (postingTotal / postingMax) * 100 : 0;
  
  // 5. RESPONSIVENESS SCORE (10% weight)
  let responseTotal = 0;
  let responseMax = 0;
  const responseTimes = [];
  if (sme.facebook?.responseTime) responseTimes.push(sme.facebook.responseTime);
  if (sme.instagram?.responseTime) responseTimes.push(sme.instagram.responseTime);
  if (sme.whatsapp?.responseTime) responseTimes.push(sme.whatsapp.responseTime);
  
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const responseScore = Math.max(0, Math.min(100, 100 - (avgResponseTime / 24) * 100));
    responseTotal += responseScore * 100;
    responseMax += 100;
  } else {
    responseTotal += 50;
    responseMax += 100;
  }
  scores.responsiveness = responseMax > 0 ? (responseTotal / responseMax) * 100 : 0;
  
  // FINAL SCORE
  const finalScore = (scores.profile * 0.25) + (scores.engagement * 0.30) + (scores.presence * 0.25) + (scores.posting * 0.10) + (scores.responsiveness * 0.10);
  
  let grade = 'F';
  if (finalScore >= 90) grade = 'A+';
  else if (finalScore >= 80) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 50) grade = 'D';
  
  return {
    totalScore: Math.round(finalScore),
    grade: grade,
    breakdown: scores
  };
}

// ── INJECT DATA INTO PAGE + TRIGGER SCORE COMPUTATION ────────────────────────
function injectMockData(sme) {
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
    platformData.google    = { profileComplete: sme.google.profileComplete, posts: 2, hasKnowledgePanel: sme.google.hasKnowledgePanel, rating: sme.google.rating, reviews: sme.google.reviews };
    platformData.whatsapp  = { responseTime: sme.whatsapp.responseTime, messages: sme.whatsapp.messages, postsPerWeek: sme.whatsapp.postsPerWeek, profileComplete: sme.whatsapp.profileComplete };
    platformData.website   = { url: sme.website.url, visitors: sme.website.visitors, posts: sme.website.posts, contact: sme.website.contact, pagespeedScore: sme.website.pagespeedScore };
    platformData.telegram  = { username: sme.telegram.username, subscribers: sme.telegram.subscribers, hasPhoto: sme.telegram.hasPhoto };
    if (typeof connectedList !== 'undefined') connectedList = ['facebook', 'instagram', 'google', 'telegram'];
  }

  // Calculate score independently
  const scoreResult = calculateIndependentScore(sme);
  
  // Show toast with the injected profile summary
  showMockToast(sme, scoreResult);

  // Auto-compute after 1500ms
  if (typeof computeAndSave === 'function') {
    setTimeout(() => computeAndSave(), 1500);
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
    <div style="font-size:12px;opacity:.7;">Gemini is creating a realistic business profile for you.</div>
  `;
  document.body.appendChild(toast);
}

function showMockToast(sme, scoreResult) {
  document.getElementById('mock-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'mock-toast';
  toast.style.cssText = `
    position:fixed;bottom:90px;right:24px;background:#1e293b;color:#fff;
    padding:14px 18px;border-radius:12px;font-family:'DM Sans',sans-serif;
    font-size:13px;max-width:320px;box-shadow:0 8px 24px rgba(0,0,0,.25);
    z-index:9999;animation:slideUp .3s ease;
  `;
  
  const scoreColor = scoreResult.totalScore >= 70 ? '#10b981' : scoreResult.totalScore >= 50 ? '#f59e0b' : '#ef4444';
  
  toast.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px;">${sme.label}</div>
    <div style="font-size:12px;opacity:.75;margin-bottom:8px;">${sme.name} · ${sme.location}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;opacity:.7;">
      <span>📘 FB: ${sme.facebook.posts} posts</span>
      <span>📸 IG: ${sme.instagram.posts} posts</span>
      <span>💬 WA: ${sme.whatsapp.responseTime}h</span>
      <span>🌐 Visitors: ${sme.website.visitors}/mo</span>
    </div>
    <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;">
      <span style="font-weight:600;">📊 Score:</span>
      <span style="font-weight:700;color:${scoreColor};">${scoreResult.totalScore}/100 (${scoreResult.grade})</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 8000);
}

// Helper — gets sector from auth metadata for the loading toast label
function getUserSector() {
  try {
    const meta = window._mockUserMeta;
    return meta?.sector || 'SME';
  } catch (_) { return 'SME'; }
}

// ── FAB BUTTON + MENU ────────────────────────────────────────────────────────
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

  // AI Generate option
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

function toggleMockMenu() { 
  const menu = document.getElementById('mock-menu');
  if (menu) menu.classList.toggle('open'); 
}
function closeMockMenu() { 
  const menu = document.getElementById('mock-menu');
  if (menu) menu.classList.remove('open'); 
}

// ── AUTO-RENDER FAB WHEN SCRIPT LOADS (THIS WAS MISSING!) ────────────────────
document.addEventListener('DOMContentLoaded', renderMockFAB);
if (document.readyState !== 'loading') renderMockFAB();
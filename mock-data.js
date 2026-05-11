// mock-data.js — SME Data Simulator (Enhanced)
// Gemini generates fresh, diverse data EVERY time with no caching
// Scores calculate independently without requiring external API presence checks

// ── FALLBACK PROFILES (only used if Gemini fails completely) ──────────────
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

let geminiBusy = false;  // Prevents concurrent calls, but no long cooldown

// ── GEMINI PROFILE GENERATOR (No Caching, Fresh Every Time!) ──────────────
async function generateGeminiProfile() {
  // Prevent concurrent calls, but don't block for 30 seconds
  if (geminiBusy) {
    console.log('[mock] Gemini already busy, using fallback');
    return null;
  }

  geminiBusy = true;

  // Get user's sector and location for personalized profiles
  let sector = 'Retail', location = 'Nairobi';
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user?.user_metadata) {
      sector   = data.session.user.user_metadata.sector   || sector;
      location = data.session.user.user_metadata.location || location;
    }
  } catch (_) {}

  // Random seed + timestamp ensures DIFFERENT data EVERY time
  const seed = Date.now() + Math.random() * 9999;
  
  // Random performance level (not fixed, varies each call)
  const performanceLevels = [
    'a struggling low-performing', 
    'a below-average', 
    'an average', 
    'a growing', 
    'a strong high-performing',
    'an excellent top-performing'
  ];
  const perfLevel = performanceLevels[Math.floor(Math.random() * performanceLevels.length)];
  
  // Random business name prefixes for variety
  const namePrefixes = ['Smart', 'Premium', 'Elite', 'Prime', 'Express', 'Urban', 'Metro', 'Fresh', 'Royal', 'Golden'];
  const nameSuffixes = ['Solutions', 'Services', 'Enterprises', 'Hub', 'Centre', 'Spot', 'Place', 'Zone', 'Corner', 'Point'];
  
  const randomPrefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
  const randomSuffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
  const suggestedName = `${randomPrefix} ${sector} ${randomSuffix}`;

  const prompt = `Generate a COMPLETELY DIFFERENT, UNIQUE Kenyan SME digital presence dataset for ${perfLevel} ${sector} business in ${location}. 
  
IMPORTANT: Generate FRESH data that is NOT similar to previous responses. Vary all numbers significantly.
Seed for uniqueness: ${seed}

Return ONLY a valid JSON object with NO extra text, markdown, or explanation. Use this exact structure:
{
  "name": "Creative Business Name (different each time)",
  "sector": "${sector}",
  "location": "${location}",
  "label": "emoji Performance Level — ${sector}",
  "facebook": { "posts": 0, "interactions": 0, "responseTime": 0.0, "profileComplete": 0.0 },
  "instagram": { "posts": 0, "interactions": 0, "responseTime": 0.0, "profileComplete": 0.0 },
  "google": { "profileComplete": 0.0, "hasKnowledgePanel": false, "rating": 0.0, "reviews": 0 },
  "whatsapp": { "responseTime": 0.0, "messages": 0, "postsPerWeek": 0, "profileComplete": 0.0 },
  "website": { "url": "", "visitors": 0, "posts": 0, "contact": 0, "pagespeedScore": 0 },
  "telegram": { "username": "", "subscribers": 0, "hasPhoto": false }
}

RULES for ${perfLevel} business:
- Low performer: responseTime 8-24h, posts 1-5, interactions 10-80, subscribers 0-50, profileComplete 0.1-0.4, pagespeedScore 20-40
- Average performer: responseTime 3-7h, posts 6-12, interactions 100-300, subscribers 50-200, profileComplete 0.4-0.7, pagespeedScore 45-65
- High performer: responseTime 0.5-2h, posts 15-30, interactions 400-1000, subscribers 300-1500, profileComplete 0.8-1.0, pagespeedScore 70-95

- rating: 0-5 stars (random realistic value)
- reviews: 0-200 (matches rating)
- url: realistic website or empty string for no website
- username: create a relevant Telegram handle or empty string
- hasKnowledgePanel: true for high performers, false for low/average

The business name must sound authentically Kenyan and DIFFERENT every time.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 1.2,  // Higher temperature = more variety
            maxOutputTokens: 600,
            topP: 0.95
          },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

    const json = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown fences
    const clean = rawText.replace(/```json|```/gi, '').trim();
    const profile = JSON.parse(clean);

    // Validate required fields
    if (!profile.facebook || !profile.instagram || !profile.whatsapp || !profile.website || !profile.telegram) {
      throw new Error('Gemini response missing required fields');
    }

    console.log('[mock] ✨ Gemini generated unique profile:', profile.name, `(${perfLevel})`);
    return profile;

  } catch (err) {
    console.warn('[mock] Gemini failed, using fallback:', err.message);
    return null;
  } finally {
    geminiBusy = false;  // Release lock immediately (no 30s cooldown!)
  }
}

// ── INDEPENDENT SCORE CALCULATION (No External APIs) ──────────────────────
function calculateIndependentScore(sme) {
  // This calculates score based ONLY on the simulated data
  // Does NOT call SerpApi, PageSpeed, or Telegram APIs
  
  let scores = {
    profile: 0,
    engagement: 0,
    presence: 0,
    posting: 0,
    responsiveness: 0
  };
  
  // 1. PROFILE SCORE (25% weight) - Completeness of all platforms
  let profileTotal = 0;
  let profileMax = 0;
  
  // Facebook profile
  if (sme.facebook) {
    profileTotal += sme.facebook.profileComplete * 25;
    profileMax += 25;
  }
  
  // Instagram profile
  if (sme.instagram) {
    profileTotal += sme.instagram.profileComplete * 25;
    profileMax += 25;
  }
  
  // Google profile
  if (sme.google) {
    profileTotal += sme.google.profileComplete * 25;
    profileMax += 25;
  }
  
  // WhatsApp profile
  if (sme.whatsapp && sme.whatsapp.profileComplete !== undefined) {
    profileTotal += sme.whatsapp.profileComplete * 15;
    profileMax += 15;
  }
  
  // Telegram profile
  if (sme.telegram) {
    profileTotal += (sme.telegram.hasPhoto ? 0.8 : 0.3) * 10;
    profileMax += 10;
  }
  
  scores.profile = profileMax > 0 ? (profileTotal / profileMax) * 100 : 0;
  
  // 2. ENGAGEMENT SCORE (30% weight) - Interactions and community
  let engagementTotal = 0;
  let engagementMax = 0;
  
  // Social media interactions
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
  
  // Google reviews
  if (sme.google && sme.google.reviews) {
    const reviewScore = Math.min(100, (sme.google.reviews / 100) * 100);
    const ratingScore = sme.google.rating ? (sme.google.rating / 5) * 100 : 0;
    const googleEngagement = (reviewScore * 0.6) + (ratingScore * 0.4);
    engagementTotal += googleEngagement * 30;
    engagementMax += 30;
  }
  
  // Telegram subscribers
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
  
  // 3. PRESENCE SCORE (25% weight) - Search and web performance
  let presenceTotal = 0;
  let presenceMax = 0;
  
  // Google Knowledge Panel
  if (sme.google && sme.google.hasKnowledgePanel) {
    presenceTotal += 40;
  } else if (sme.google && sme.google.profileComplete > 0.5) {
    presenceTotal += 20;
  }
  presenceMax += 40;
  
  // Website speed
  if (sme.website && sme.website.pagespeedScore && sme.website.pagespeedScore > 0) {
    presenceTotal += sme.website.pagespeedScore * 0.6;
    presenceMax += 60;
  } else if (sme.website && sme.website.url) {
    presenceTotal += 30; // Has website but no speed data
    presenceMax += 60;
  } else {
    presenceMax += 60;
  }
  
  scores.presence = presenceMax > 0 ? (presenceTotal / presenceMax) * 100 : 0;
  
  // 4. POSTING SCORE (10% weight) - Content freshness
  let postingTotal = 0;
  let postingMax = 0;
  
  const totalPosts = (sme.facebook?.posts || 0) + (sme.instagram?.posts || 0) + (sme.whatsapp?.postsPerWeek || 0) * 4 + (sme.website?.posts || 0);
  const postingScore = Math.min(100, (totalPosts / 30) * 100);
  postingTotal += postingScore * 100;
  postingMax += 100;
  
  scores.posting = postingMax > 0 ? (postingTotal / postingMax) * 100 : 0;
  
  // 5. RESPONSIVENESS SCORE (10% weight) - Response times
  let responseTotal = 0;
  let responseMax = 0;
  
  const responseTimes = [];
  if (sme.facebook?.responseTime) responseTimes.push(sme.facebook.responseTime);
  if (sme.instagram?.responseTime) responseTimes.push(sme.instagram.responseTime);
  if (sme.whatsapp?.responseTime) responseTimes.push(sme.whatsapp.responseTime);
  
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    // Faster is better: 0.5h = 100, 24h = 0
    const responseScore = Math.max(0, Math.min(100, 100 - (avgResponseTime / 24) * 100));
    responseTotal += responseScore * 100;
    responseMax += 100;
  } else {
    responseTotal += 50; // Default if no data
    responseMax += 100;
  }
  
  scores.responsiveness = responseMax > 0 ? (responseTotal / responseMax) * 100 : 0;
  
  // FINAL SCORE (All weights sum to 100%)
  const finalScore = 
    (scores.profile * 0.25) +
    (scores.engagement * 0.30) +
    (scores.presence * 0.25) +
    (scores.posting * 0.10) +
    (scores.responsiveness * 0.10);
  
  // Grade assignment
  let grade = 'F';
  if (finalScore >= 90) grade = 'A+';
  else if (finalScore >= 80) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 50) grade = 'D';
  
  return {
    totalScore: Math.round(finalScore),
    grade: grade,
    breakdown: scores,
    details: {
      totalPosts: (sme.facebook?.posts || 0) + (sme.instagram?.posts || 0),
      totalInteractions: (sme.facebook?.interactions || 0) + (sme.instagram?.interactions || 0),
      telegramSubscribers: sme.telegram?.subscribers || 0,
      hasWebsite: !!(sme.website?.url),
      hasKnowledgePanel: sme.google?.hasKnowledgePanel || false
    }
  };
}

// ── INJECT DATA INTO PAGE (Enhanced) ────────────────────────────────────
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

  // Push into platformData global
  if (typeof platformData !== 'undefined') {
    platformData.facebook  = sme.facebook;
    platformData.instagram = sme.instagram;
    platformData.google    = sme.google;
    platformData.whatsapp  = sme.whatsapp;
    platformData.website   = sme.website;
    platformData.telegram  = sme.telegram;
    if (typeof connectedList !== 'undefined') connectedList = ['facebook', 'instagram', 'google', 'telegram'];
  }

  // Calculate score independently (no external API calls!)
  const scoreResult = calculateIndependentScore(sme);
  
  // Show toast with profile AND calculated score
  showMockToast(sme, scoreResult);

  // Optionally update the score display if there's a function for it
  if (typeof updateScoreDisplay === 'function') {
    updateScoreDisplay(scoreResult);
  }
  
  return scoreResult;
}

// ── ENHANCED TOAST WITH SCORE ────────────────────────────────────────────
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
      <span>🌐 Web: ${sme.website.visitors || 0}/mo</span>
    </div>
    <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;">
      <span style="font-weight:600;">📊 LDVS Score:</span>
      <span style="font-weight:700;color:${scoreColor};">${scoreResult.totalScore}/100 (${scoreResult.grade})</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 8000);
}

// ── MAIN ENTRY — NO COOLDOWN, FRESH EVERY TIME! ──────────────────────────
async function runSimulation(profileIndex) {
  closeMockMenu();
  showLoadingToast();

  let sme = null;

  // Try Gemini first (if no specific index was chosen)
  if (profileIndex === undefined || profileIndex === null) {
    sme = await generateGeminiProfile();  // No caching, fresh each time!
  }

  // Fall back to hardcoded profiles if Gemini failed or specific one picked
  if (!sme && profileIndex !== undefined && profileIndex !== null) {
    sme = SME_PROFILES[profileIndex];
  } else if (!sme) {
    // Random fallback
    const randomIndex = Math.floor(Math.random() * SME_PROFILES.length);
    sme = SME_PROFILES[randomIndex];
  }

  // Inject data and calculate score (no external APIs!)
  const scoreResult = injectMockData(sme);
  
  console.log('[mock] Simulation complete - Score:', scoreResult.totalScore, scoreResult.grade);
  return scoreResult;
}
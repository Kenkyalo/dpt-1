// apis.js — External API integrations for DPT
// SerpApi (search presence), Google PageSpeed, Telegram Bot
// Include after config.js on connect-platforms.html

// ── 1. SERP API — Search Presence ────────────────────────────
async function checkSearchPresence(businessName, location) {
  if (!businessName) return null;
  try {
    const query = encodeURIComponent(`${businessName} ${location || 'Kenya'}`);
    const url   = `https://serpapi.com/search.json?q=${query}&location=Kenya&hl=en&gl=ke&api_key=${SERP_API_KEY}`;
    const res   = await fetch(url);
    const data  = await res.json();

    const organic      = data.organic_results || [];
    const localResults = data.local_results?.places || [];

    let position = null, snippet = null;
    for (let i = 0; i < organic.length; i++) {
      const r = organic[i];
      if (
        r.title?.toLowerCase().includes(businessName.toLowerCase()) ||
        r.snippet?.toLowerCase().includes(businessName.toLowerCase())
      ) { position = i + 1; snippet = r.snippet; break; }
    }

    const localMatch = localResults.find(p =>
      p.title?.toLowerCase().includes(businessName.toLowerCase())
    );
    const kg      = data.knowledge_graph;
    const rating  = localMatch?.rating  || kg?.rating  || null;
    const reviews = localMatch?.reviews || kg?.reviews  || null;

    return {
      found:       position !== null || !!localMatch,
      position,
      inLocalPack: !!localMatch,
      rating,
      reviews,
      snippet,
      hasKnowledgePanel: !!kg,
    };
  } catch (e) {
    console.warn('[SerpApi] Error:', e.message);
    return null;
  }
}

// ── 2. GOOGLE PAGESPEED ───────────────────────────────────────
async function checkPageSpeed(url) {
  if (!url || url.trim() === '') return null;
  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(cleanUrl)}&strategy=mobile`;
    const res    = await fetch(apiUrl);
    const data   = await res.json();
    if (data.error) return null;
    const cats   = data.lighthouseResult?.categories;
    const audits = data.lighthouseResult?.audits;
    return {
      mobile:     Math.round((cats?.performance?.score  || 0) * 100),
      accessible: Math.round((cats?.accessibility?.score|| 0) * 100),
      seo:        Math.round((cats?.seo?.score          || 0) * 100),
      fcp:        audits?.['first-contentful-paint']?.displayValue || '—',
      lcp:        audits?.['largest-contentful-paint']?.displayValue || '—',
      composite:  Math.round(((cats?.performance?.score || 0) + (cats?.accessibility?.score || 0) + (cats?.seo?.score || 0)) / 3 * 100),
    };
  } catch (e) {
    console.warn('[PageSpeed] Error:', e.message);
    return null;
  }
}

// ── 3. TELEGRAM BOT ──────────────────────────────────────────
async function checkTelegramChannel(channelUsername) {
  if (!channelUsername) return null;
  const username = channelUsername.replace('@', '').trim();
  if (!username) return null;
  try {
    const res  = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getChat?chat_id=@${username}`
    );
    const data = await res.json();
    if (!data.ok) return { found: false, error: data.description };
    const chat = data.result;

    const countRes  = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getChatMemberCount?chat_id=@${username}`
    );
    const countData = await countRes.json();
    const members   = countData.ok ? countData.result : 0;

    return {
      found:       true,
      username,
      title:       chat.title || username,
      description: chat.description || '',
      subscribers: members,
      type:        chat.type,
      hasPhoto:    !!chat.photo,
    };
  } catch (e) {
    console.warn('[Telegram] Error:', e.message);
    return { found: false, error: e.message };
  }
}

// ── SCORE HELPERS ─────────────────────────────────────────────
function getSearchPresenceScore(r) {
  if (!r || !r.found) return 0;
  if (r.inLocalPack)       return 100;
  if (r.position <= 3)     return 90;
  if (r.position <= 10)    return 70;
  return 40;
}

function getPageSpeedScore(r) {
  if (!r) return null;
  return Math.round((r.mobile + r.accessible + r.seo) / 3);
}

function getTelegramScore(r) {
  if (!r || !r.found) return 0;
  const s = r.subscribers || 0;
  if (s >= 1000) return 100;
  if (s >= 500)  return 80;
  if (s >= 100)  return 60;
  if (s >= 50)   return 40;
  if (s >= 10)   return 20;
  return 10;
}

// ── 4. ADVANCED SCORING FUNCTION (For simulation support) ────
async function fetchCompleteBusinessData(url, businessName, location, telegramChannel) {
  // Check if we're in simulation mode
  if (typeof window !== 'undefined' && window.isSimulating) {
    console.log('🎭 Simulation mode: Using mock data');
    
    // Build mock response from platformData
    const mockSpeed = {
      composite: window.platformData?.website?.pagespeedScore || 65,
      performance: 70,
      seo: 65,
      accessibility: 60,
      fcp: '1.8s',
      lcp: '2.5s',
      mobileReady: true
    };
    
    const mockSearch = {
      found: true,
      position: window.platformData?.google?.hasKnowledgePanel ? 1 : 4,
      inLocalPack: window.platformData?.google?.hasKnowledgePanel || false,
      hasKnowledgePanel: window.platformData?.google?.hasKnowledgePanel || false,
      rating: window.platformData?.google?.rating || 4.2,
      reviews: window.platformData?.google?.reviews || 45,
      snippet: window.platformData?.google?.snippet || 'Business description here',
      visibilityScore: window.platformData?.google?.hasKnowledgePanel ? 90 : 60
    };
    
    const mockTelegram = {
      found: !!(window.platformData?.telegram?.username),
      username: window.platformData?.telegram?.username || '',
      subscribers: window.platformData?.telegram?.subscribers || 0,
      hasPhoto: window.platformData?.telegram?.hasPhoto || false,
      title: window.platformData?.telegram?.username || ''
    };
    
    return calculateAdvancedScore(mockSpeed, mockSearch, mockTelegram);
  }
  
  // Normal mode: Call real APIs
  const results = await Promise.all([
    checkPageSpeed(url),
    checkSearchPresence(businessName, location),
    checkTelegramChannel(telegramChannel)
  ]);
  
  const [speed, search, telegram] = results;
  return calculateAdvancedScore(speed, search, telegram);
}

function calculateAdvancedScore(speed, search, telegram) {
  // ========== 1. PROFILE SCORE (25%) ==========
  let profileScore = 0;
  let profileMax = 0;
  
  // Google Profile (40% of profile)
  if (search?.hasKnowledgePanel) {
    profileScore += 40;
    profileMax += 40;
  } else if (search?.found) {
    profileScore += 20;
    profileMax += 40;
  } else {
    profileMax += 40;
  }
  
  // Telegram Profile (30% of profile)
  if (telegram?.hasPhoto) {
    profileScore += 30;
    profileMax += 30;
  } else if (telegram?.found) {
    profileScore += 10;
    profileMax += 30;
  } else {
    profileMax += 30;
  }
  
  // Business Description/Snippet (30% of profile)
  if (search?.snippet && search.snippet.length > 50) {
    profileScore += 30;
  } else if (search?.snippet) {
    profileScore += 15;
  }
  profileMax += 30;
  
  const profileScoreNormalized = profileMax > 0 ? (profileScore / profileMax) * 100 : 0;

  // ========== 2. ENGAGEMENT SCORE (30%) ==========
  let engagementScore = 0;
  
  const reviewScore = search?.reviews ? Math.min(100, (search.reviews / 500) * 100) : 0;
  const ratingScore = search?.rating ? (search.rating / 5) * 100 : 0;
  const googleEngagement = (reviewScore * 0.6) + (ratingScore * 0.4);
  
  let telegramEngagement = 0;
  const subscribers = telegram?.subscribers || 0;
  if (subscribers >= 10000) telegramEngagement = 100;
  else if (subscribers >= 5000) telegramEngagement = 80;
  else if (subscribers >= 1000) telegramEngagement = 60;
  else if (subscribers >= 500) telegramEngagement = 40;
  else if (subscribers >= 100) telegramEngagement = 20;
  else if (subscribers >= 10) telegramEngagement = 10;
  
  engagementScore = (googleEngagement * 0.5) + (telegramEngagement * 0.5);

  // ========== 3. PRESENCE SCORE (25%) ==========
  let positionScore = 0;
  const position = search?.position || 0;
  if (position === 1) positionScore = 100;
  else if (position === 2) positionScore = 80;
  else if (position === 3) positionScore = 60;
  else if (position <= 5) positionScore = 40;
  else if (position <= 10) positionScore = 20;
  
  const speedScore = speed?.composite || 0;
  const presenceScore = (positionScore * 0.6) + (speedScore * 0.4);

  // ========== 4. POSTING SCORE (10%) ==========
  const postingScore = 50;
  
  // ========== 5. RESPONSIVENESS SCORE (10%) ==========
  const responsivenessScore = 50;

  // ========== FINAL CALCULATION ==========
  const totalScore = 
    (profileScoreNormalized * 0.25) +
    (engagementScore * 0.30) +
    (presenceScore * 0.25) +
    (postingScore * 0.10) +
    (responsivenessScore * 0.10);

  // ========== GRADE ASSIGNMENT ==========
  let grade = 'F';
  let recommendation = '';
  
  if (totalScore >= 90) {
    grade = 'A+';
    recommendation = 'Excellent digital presence! Maintain consistency.';
  } else if (totalScore >= 80) {
    grade = 'A';
    recommendation = 'Very strong. Focus on engagement to reach top tier.';
  } else if (totalScore >= 70) {
    grade = 'B';
    recommendation = 'Good foundation. Improve profile completeness.';
  } else if (totalScore >= 60) {
    grade = 'C';
    recommendation = 'Average. Update profiles and increase posting.';
  } else if (totalScore >= 50) {
    grade = 'D';
    recommendation = 'Below average. Claim missing listings urgently.';
  } else {
    grade = 'F';
    recommendation = 'Poor digital presence. Start with Google Business Profile.';
  }

  return {
    totalScore: Math.round(totalScore),
    grade: grade,
    recommendation: recommendation,
    breakdown: {
      profile: Math.round(profileScoreNormalized),
      engagement: Math.round(engagementScore),
      presence: Math.round(presenceScore),
      posting: Math.round(postingScore),
      responsiveness: Math.round(responsivenessScore)
    },
    details: {
      searchPosition: position,
      telegramSubscribers: subscribers,
      googleRating: search?.rating,
      pageSpeedScore: speedScore,
      hasKnowledgePanel: search?.hasKnowledgePanel
    },
    raw: { speed, search, telegram }
  };
}
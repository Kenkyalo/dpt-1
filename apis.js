async function fetchCompleteBusinessData(url, businessName, location, telegramChannel) {
  const results = await Promise.all([
    fetchDetailedPageSpeed(url),
    fetchDetailedSearch(businessName, location),
    fetchTelegramData(telegramChannel)
  ]);
  
  const [speed, search, telegram] = results;

  // ========== 1. PROFILE SCORE (25%) ==========
  // Completeness of business profile across platforms
  let profileScore = 0;
  let profileMax = 0;
  
  // Google Profile (40% of profile)
  if (search.hasKnowledgePanel) {
    profileScore += 40;
    profileMax += 40;
  } else if (search.found) {
    profileScore += 20; // Partial credit
    profileMax += 40;
  } else {
    profileMax += 40;
  }
  
  // Telegram Profile (30% of profile)
  if (telegram.hasPhoto) {
    profileScore += 30;
    profileMax += 30;
  } else if (telegram.found) {
    profileScore += 10;
    profileMax += 30;
  } else {
    profileMax += 30;
  }
  
  // Business Description/Snippet (30% of profile)
  if (search.snippet && search.snippet.length > 50) {
    profileScore += 30;
  } else if (search.snippet) {
    profileScore += 15;
  }
  profileMax += 30;
  
  const profileScoreNormalized = (profileScore / profileMax) * 100;

  // ========== 2. ENGAGEMENT SCORE (30%) ==========
  // Customer interaction and community size
  let engagementScore = 0;
  
  // Google Reviews (50% of engagement)
  const reviewScore = search.reviews ? Math.min(100, (search.reviews / 500) * 100) : 0;
  const ratingScore = search.rating ? (search.rating / 5) * 100 : 0;
  const googleEngagement = (reviewScore * 0.6) + (ratingScore * 0.4);
  
  // Telegram Subscribers (50% of engagement)
  let telegramEngagement = 0;
  if (telegram.subscribers >= 10000) telegramEngagement = 100;
  else if (telegram.subscribers >= 5000) telegramEngagement = 80;
  else if (telegram.subscribers >= 1000) telegramEngagement = 60;
  else if (telegram.subscribers >= 500) telegramEngagement = 40;
  else if (telegram.subscribers >= 100) telegramEngagement = 20;
  else if (telegram.subscribers >= 10) telegramEngagement = 10;
  else telegramEngagement = 0;
  
  engagementScore = (googleEngagement * 0.5) + (telegramEngagement * 0.5);

  // ========== 3. PRESENCE SCORE (25%) ==========
  // Visibility and technical performance
  let presenceScore = 0;
  
  // Search Position (60% of presence)
  let positionScore = 0;
  if (search.position === 1) positionScore = 100;
  else if (search.position === 2) positionScore = 80;
  else if (search.position === 3) positionScore = 60;
  else if (search.position <= 5) positionScore = 40;
  else if (search.position <= 10) positionScore = 20;
  else positionScore = 0;
  
  // PageSpeed Performance (40% of presence)
  const speedScore = speed.composite || 0;
  
  presenceScore = (positionScore * 0.6) + (speedScore * 0.4);

  // ========== 4. POSTING SCORE (10%) - PLACEHOLDER ==========
  // Content freshness and activity
  // (You'd need social media APIs for this)
  const postingScore = 50; // Default middle score until API available
  
  // ========== 5. RESPONSIVENESS SCORE (10%) - PLACEHOLDER ==========
  // Reply rates, response times
  // (You'd need platform APIs for this)
  const responsivenessScore = 50; // Default middle score until API available

  // ========== FINAL CALCULATION ==========
  // Weights sum to 100%
  const totalScore = 
    (profileScoreNormalized * 0.25) +   // Profile completeness
    (engagementScore * 0.30) +           // Community engagement
    (presenceScore * 0.25) +             // Search & performance
    (postingScore * 0.10) +              // Content activity
    (responsivenessScore * 0.10);        // Customer interaction

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
      searchPosition: search.position,
      telegramSubscribers: telegram.subscribers,
      googleRating: search.rating,
      pageSpeedScore: speed.composite,
      hasKnowledgePanel: search.hasKnowledgePanel
    },
    raw: { speed, search, telegram }
  };
}

// Example usage with visual feedback
async function displayBusinessDashboard(url, businessName, location, telegramChannel) {
  const data = await fetchCompleteBusinessData(url, businessName, location, telegramChannel);
  
  console.log(`
  ═══════════════════════════════════════
  📊 DIGITAL PRESENCE DASHBOARD
  ═══════════════════════════════════════
  Total Score: ${data.totalScore}/100 (Grade: ${data.grade})
  💡 ${data.recommendation}
  
  📈 Breakdown:
  ├─ Profile:      ${data.breakdown.profile}/100 (25% weight)
  ├─ Engagement:   ${data.breakdown.engagement}/100 (30% weight)
  ├─ Presence:     ${data.breakdown.presence}/100 (25% weight)
  ├─ Posting:      ${data.breakdown.posting}/100 (10% weight)
  └─ Responsiveness: ${data.breakdown.responsiveness}/100 (10% weight)
  
  🔍 Key Metrics:
  ├─ Google Search: #${data.details.searchPosition}
  ├─ Telegram: ${data.details.telegramSubscribers} members
  ├─ Google Rating: ${data.details.googleRating || 'N/A'} ⭐
  └─ PageSpeed: ${data.details.pageSpeedScore || 'N/A'}/100
  ═══════════════════════════════════════
  `);
  
  return data;
}
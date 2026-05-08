const EDGE_FN = 'https://xagbguncsimivveezckc.supabase.co/functions/v1/get-recommendations';

async function callEdge(payload) {
  const res = await fetch(EDGE_FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Edge function ' + res.status);
  return res.json();
}

async function fetchPageSpeed(url) {
  if (!url || !url.startsWith('http')) return { success: false, composite: 0 };
  try {
    return await callEdge({ action: 'pagespeed', url });
  } catch (err) {
    console.warn('PageSpeed error:', err.message);
    return { success: false, composite: 0 };
  }
}

async function fetchSearchVisibility(businessName, location) {
  location = location || 'Kenya';
  if (!businessName) return { success: false, found: false, visibilityScore: 0 };
  try {
    return await callEdge({ action: 'serp', businessName: businessName, location: location });
  } catch (err) {
    console.warn('SERP error:', err.message);
    return mockSearchResult(businessName);
  }
}

function mockSearchResult(businessName) {
  var pos = Math.floor(Math.random() * 5) + 1;
  var score = Math.max(0, 100 - ((pos - 1) * 15));
  return {
    success: true, found: true, mock: true,
    position: pos, visibilityScore: score,
    hasKnowledgePanel: Math.random() > 0.6,
    title: businessName + ' - Business Profile',
    snippet: 'Find ' + businessName + ' in Kenya.',
    totalResults: Math.floor(1000 + Math.random() * 10000),
  };
}

async function fetchWebsiteData(url, businessName, location) {
  var results = await Promise.all([
    fetchPageSpeed(url),
    fetchSearchVisibility(businessName, location),
  ]);
  var speed = results[0];
  var search = results[1];

  var websiteScore = 0;
  var breakdown = {};

  if (speed.success) {
    breakdown.pagespeed = speed.composite;
    websiteScore += speed.composite * 0.6;
  }

  if (search.success && search.found) {
    breakdown.searchVisibility = search.visibilityScore;
    websiteScore += search.visibilityScore * 0.4;
  } else if (search.success && !search.found) {
    websiteScore = websiteScore * 0.6;
  }

  return {
    websiteScore: Math.round(Math.min(100, websiteScore)),
    pagespeed: speed,
    searchVisibility: search,
    breakdown: breakdown,
  };
}

function renderPageSpeedResult(result, containerId) {
  containerId = containerId || 'pagespeed-result';
  var el = document.getElementById(containerId);
  if (!el) return;
  if (!result.success) {
    el.innerHTML = '<div style="padding:10px;background:#f1f5f9;border-radius:8px;font-size:12px;color:#64748b;margin-top:8px;">Could not analyse website. Check the URL is correct.</div>';
    return;
  }
  var c = result.composite >= 70 ? '#10b981' : result.composite >= 50 ? '#f59e0b' : '#ef4444';
  el.innerHTML = '<div style="background:#f8fafc;border-radius:12px;padding:14px;margin-top:10px;border:1px solid #e2e8f0;">'
    + '<div style="display:flex;justify-content:space-between;margin-bottom:10px;">'
    + '<span style="font-size:12px;font-weight:600;color:#64748b;">📊 PageSpeed Score</span>'
    + '<span style="font-family:monospace;font-size:20px;font-weight:700;color:' + c + ';">' + result.composite + '</span>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11px;text-align:center;">'
    + '<div><div style="font-weight:700;">' + result.performance + '</div><div style="color:#64748b">Performance</div></div>'
    + '<div><div style="font-weight:700;">' + result.seo + '</div><div style="color:#64748b">SEO</div></div>'
    + '<div><div style="font-weight:700;">' + result.accessibility + '</div><div style="color:#64748b">Accessibility</div></div>'
    + '</div>'
    + '<div style="margin-top:8px;font-size:11px;color:#64748b;">FCP: ' + result.fcp + ' · LCP: ' + result.lcp + ' · ' + (result.mobileReady ? '✅ Mobile ready' : '⚠️ Not mobile ready') + '</div>'
    + '</div>';
}

function renderSearchResult(result, containerId) {
  containerId = containerId || 'search-result';
  var el = document.getElementById(containerId);
  if (!el) return;
  if (!result.success || !result.found) {
    el.innerHTML = '<div style="padding:10px;background:#fee2e2;border-radius:8px;font-size:12px;color:#991b1b;margin-top:8px;">'
      + '⚠️ Business not found in Google Search. <a href="https://business.google.com" target="_blank" style="color:#991b1b;font-weight:600;">Create a free Google listing →</a></div>';
    return;
  }
  var c = result.visibilityScore >= 70 ? '#10b981' : result.visibilityScore >= 50 ? '#f59e0b' : '#ef4444';
  var icon = result.position === 1 ? '🥇' : result.position === 2 ? '🥈' : result.position === 3 ? '🥉' : '📊';
  el.innerHTML = '<div style="background:#f8fafc;border-radius:12px;padding:14px;margin-top:10px;border:1px solid #e2e8f0;">'
    + '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">'
    + '<span style="font-size:12px;font-weight:600;color:#64748b;">' + (result.mock ? '🎭 Demo · ' : '🔍 ') + 'Google Search</span>'
    + '<span style="font-size:11px;background:#dcfce7;color:#14532d;padding:2px 8px;border-radius:10px;font-weight:600;">' + icon + ' #' + result.position + '</span>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">'
    + '<span style="font-size:13px;font-weight:600;">Visibility Score</span>'
    + '<span style="font-family:monospace;font-size:20px;font-weight:700;color:' + c + ';">' + result.visibilityScore + '</span>'
    + '</div>'
    + (result.title ? '<div style="font-size:12px;color:#64748b;"><strong>Found as:</strong> ' + result.title + '</div>' : '')
    + (result.hasKnowledgePanel ? '<div style="font-size:12px;color:#10b981;margin-top:4px;">✅ Google Knowledge Panel active</div>' : '')
    + '</div>';
}

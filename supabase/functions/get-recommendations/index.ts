import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
};

// Keys are pulled from Supabase Secrets (Environment Variables)
const SERP_API_KEY = Deno.env.get("SERP_API_KEY");
const GOOGLE_PAGESPEED_API_KEY = Deno.env.get("GOOGLE_PAGESPEED_API_KEY");
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { action } = payload;
    let responseData: any;

    // 2. Route Actions
    switch (action) {
      case "pagespeed":
      case "pagespeed_detailed":
        responseData = await handlePageSpeed(payload.url);
        break;

      case "serp":
      case "serp_detailed":
        responseData = await handleSerp(payload.businessName, payload.location);
        break;

      case "telegram":
        responseData = await handleTelegram(payload.channel || payload.username);
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: corsHeaders,
        });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// ── 1. HANDLER: Google PageSpeed ──────────────────────────────
async function handlePageSpeed(url: string) {
  if (!url) return { success: false, composite: 0 };
  
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=ACCESSIBILITY&category=PERFORMANCE&category=SEO&key=${GOOGLE_PAGESPEED_API_KEY}`;
  const res = await fetch(apiUrl);
  const data = await res.json();

  if (data.error) return { success: false, error: data.error.message };

  const cats = data.lighthouseResult?.categories;
  const audits = data.lighthouseResult?.audits;

  const performance = Math.round((cats?.performance?.score || 0) * 100);
  const seo = Math.round((cats?.seo?.score || 0) * 100);
  const accessibility = Math.round((cats?.accessibility?.score || 0) * 100);

  return {
    success: true,
    composite: Math.round((performance + seo + accessibility) / 3),
    performance,
    seo,
    accessibility,
    fcp: audits?.["first-contentful-paint"]?.displayValue || "—",
    lcp: audits?.["largest-contentful-paint"]?.displayValue || "—",
    mobileReady: performance > 50,
  };
}

// ── 2. HANDLER: SerpApi (Search Visibility) ──────────────────
async function handleSerp(businessName: string, location: string) {
  if (!businessName) return { success: false, found: false, visibilityScore: 0 };
  
  const loc = location || "Kenya";
  const query = encodeURIComponent(`${businessName} ${loc}`);
  const apiUrl = `https://serpapi.com/search.json?q=${query}&location=${encodeURIComponent(loc)}&hl=en&gl=ke&api_key=${SERP_API_KEY}`;
  
  const res = await fetch(apiUrl);
  const data = await res.json();

  const organic = data.organic_results || [];
  const localResults = data.local_results?.places || [];
  const kg = data.knowledge_graph;

  let position = null;
  let snippet = "";
  let title = null;

  // Logic from Snippet 1 Upgrade: Find match in organic results
  for (let i = 0; i < organic.length; i++) {
    const r = organic[i];
    if (
      r.title?.toLowerCase().includes(businessName.toLowerCase()) ||
      r.snippet?.toLowerCase().includes(businessName.toLowerCase())
    ) {
      position = i + 1;
      snippet = r.snippet;
      title = r.title;
      break;
    }
  }

  const localMatch = localResults.find((p: any) =>
    p.title?.toLowerCase().includes(businessName.toLowerCase())
  );
  
  // Scoring rules from Snippet 1
  let visibilityScore = 0;
  if (localMatch) visibilityScore = 100;
  else if (position && position <= 3) visibilityScore = 90;
  else if (position && position <= 10) visibilityScore = 70;
  else if (position) visibilityScore = 40;

  return {
    success: true,
    found: position !== null || !!localMatch,
    position,
    inLocalPack: !!localMatch,
    hasKnowledgePanel: !!kg,
    visibilityScore,
    snippet,
    title: localMatch?.title || title || businessName,
    rating: localMatch?.rating || kg?.rating || null,
    reviews: localMatch?.reviews || kg?.reviews || null
  };
}

// ── 3. HANDLER: Telegram Bot ─────────────────────────────────
async function handleTelegram(username: string) {
  if (!username) return { found: false, subscribers: 0, score: 0 };
  
  const cleanUsername = username.replace('@', '').trim();
  
  // Get Chat Info
  const chatRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=@${cleanUsername}`);
  const chatData = await chatRes.json();

  if (!chatData.ok) return { found: false, error: chatData.description };

  // Get Subscriber Count
  const countRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMemberCount?chat_id=@${cleanUsername}`);
  const countData = await countRes.json();
  const subscribers = countData.ok ? countData.result : 0;

  // Telegram Scoring Logic from Snippet 1
  let score = 0;
  if (subscribers >= 1000) score = 100;
  else if (subscribers >= 500) score = 80;
  else if (subscribers >= 100) score = 60;
  else if (subscribers >= 50) score = 40;
  else if (subscribers >= 10) score = 20;
  else score = 10;

  return {
    success: true,
    found: true,
    username: cleanUsername,
    title: chatData.result.title || cleanUsername,
    subscribers,
    score,
    description: chatData.result.description || "",
    hasPhoto: !!chatData.result.photo,
    type: chatData.result.type
  };
}
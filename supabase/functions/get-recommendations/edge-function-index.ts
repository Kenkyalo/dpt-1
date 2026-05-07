// supabase/functions/get-recommendations/index.ts
//
// Handles three actions securely (keys never exposed to browser):
//   1. { action: "recommendations", scores, businessInfo } → Groq AI recs
//   2. { action: "serp", businessName, location }          → SerpAPI search visibility
//   3. { action: "pagespeed", url }                        → Google PageSpeed (proxied)
//
// Deploy:
//   supabase secrets set GROQ_API_KEY=your_groq_key
//   supabase secrets set SERP_API_KEY=f9c69d1301ae463b1d589fbaa7f3fab327d32e0dbf02f6d96e8744c0556b3df8
//   supabase functions deploy get-recommendations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-8b-8192";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { action } = body;

    // ── 1. AI RECOMMENDATIONS ─────────────────────────────────────
    if (!action || action === "recommendations") {
      const { scores, businessInfo } = body;
      const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
      if (!GROQ_API_KEY) return json({ error: "GROQ_API_KEY not set" }, 500);

      const prompt = `You are a digital marketing advisor helping Kenyan SMEs improve their online presence.

Business: ${businessInfo?.businessName || "Kenyan SME"} | Sector: ${businessInfo?.sector || "General"} | Location: ${businessInfo?.location || "Kenya"}
Connected platforms: ${(businessInfo?.platforms || []).join(", ") || "None yet"}

LDVS Score: ${scores.ldvs}/100
- Profile Completeness: ${scores.profileScore}
- Posting Consistency: ${scores.postingScore}
- Engagement Level: ${scores.engagementScore}
- Responsiveness: ${scores.responsivenessScore}
- Platform Presence: ${scores.platformScore}

Generate 3-5 prioritized recommendations. Focus on lowest scores first. Provide BOTH English and Kiswahili for each.
Respond ONLY with valid JSON array, no markdown:
[{"icon":"emoji","priority":"HIGH|MEDIUM|LOW","titleEn":"...","titleSw":"...","descEn":"2-3 sentences","descSw":"sentensi 2-3"}]`;

      const res  = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GROQ_MODEL, max_tokens: 1500, temperature: 0.7,
          messages: [
            { role: "system", content: "You are a digital marketing advisor. Always respond with valid JSON only, no markdown." },
            { role: "user", content: prompt }
          ]
        })
      });

      const data    = await res.json();
      const text    = data.choices?.[0]?.message?.content?.trim() || "[]";
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const recommendations = JSON.parse(cleaned);
      return json({ recommendations });
    }

    // ── 2. SERP API — Google Search Visibility ────────────────────
    if (action === "serp") {
      const { businessName, location = "Kenya" } = body;
      const SERP_API_KEY = Deno.env.get("SERP_API_KEY");
      if (!SERP_API_KEY) return json({ error: "SERP_API_KEY not set" }, 500);

      const query    = encodeURIComponent(`${businessName} ${location}`);
      const endpoint = `https://serpapi.com/search.json`
        + `?q=${query}&location=${encodeURIComponent(location)}`
        + `&hl=en&gl=ke&num=10&api_key=${SERP_API_KEY}`;

      const res  = await fetch(endpoint);
      const data = await res.json();

      if (data.error) return json({ success: false, error: data.error, found: false, visibilityScore: 0 });

      const organicResults = data.organic_results || [];
      let position: number | null = null;
      let foundResult: Record<string, string> | null = null;

      for (let i = 0; i < organicResults.length; i++) {
        const r = organicResults[i];
        if (r.title?.toLowerCase().includes(businessName.toLowerCase()) ||
            r.snippet?.toLowerCase().includes(businessName.toLowerCase())) {
          position = i + 1;
          foundResult = r;
          break;
        }
      }

      let visibilityScore = position ? Math.max(0, 100 - ((position - 1) * 10)) : 0;
      const kg = data.knowledge_graph || null;
      const hasKG = kg && (
        kg.title?.toLowerCase().includes(businessName.toLowerCase()) ||
        kg.organization?.toLowerCase().includes(businessName.toLowerCase())
      );
      if (hasKG) visibilityScore = Math.min(100, visibilityScore + 15);

      return json({
        success: true,
        found: position !== null || hasKG,
        position,
        visibilityScore,
        hasKnowledgePanel: hasKG,
        title:   foundResult?.title || kg?.title || null,
        snippet: foundResult?.snippet || null,
        link:    foundResult?.link || kg?.website || null,
        totalResults: data.search_information?.total_results || 0,
      });
    }

    // ── 3. PAGESPEED PROXY ────────────────────────────────────────
    if (action === "pagespeed") {
      const { url } = body;
      if (!url) return json({ error: "url required" }, 400);

      const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
        + `?url=${encodeURIComponent(url)}&strategy=mobile`
        + `&category=performance&category=seo&category=accessibility`;

      const res  = await fetch(endpoint);
      const data = await res.json();

      const cats = data.lighthouseResult?.categories || {};
      const performance   = Math.round((cats.performance?.score   || 0) * 100);
      const seo           = Math.round((cats.seo?.score           || 0) * 100);
      const accessibility = Math.round((cats.accessibility?.score || 0) * 100);
      const composite     = Math.round(performance * 0.45 + seo * 0.35 + accessibility * 0.20);
      const audits        = data.lighthouseResult?.audits || {};

      return json({
        success: true, composite, performance, seo, accessibility,
        fcp:        audits["first-contentful-paint"]?.displayValue || "—",
        lcp:        audits["largest-contentful-paint"]?.displayValue || "—",
        mobileReady: audits["viewport"]?.score === 1,
        url,
      });
    }

    return json({ error: "Unknown action" }, 400);

  } catch (err) {
    console.error("Edge function error:", err);
    return json({ error: String(err) }, 500);
  }
});
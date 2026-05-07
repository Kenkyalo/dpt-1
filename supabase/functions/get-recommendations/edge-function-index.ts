// supabase/functions/get-recommendations/index.ts
//
// HOW TO DEPLOY:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link your project: supabase link --project-ref xagbguncsimivveezckc
// 4. Set your Groq key as a secret:
//    supabase secrets set GROQ_API_KEY=your_actual_key_here
// 5. Deploy: supabase functions deploy get-recommendations
//
// That's it. The function will be live at:
// https://xagbguncsimivveezckc.supabase.co/functions/v1/get-recommendations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-8b-8192";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Parse request body ──────────────────────────────────────
    const { scores, businessInfo } = await req.json();

    if (!scores) {
      return new Response(
        JSON.stringify({ error: "scores is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Get Groq key from Supabase secrets (never exposed to browser) ──
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Build prompt ───────────────────────────────────────────
    const prompt = `You are a digital marketing advisor helping Kenyan small and medium-sized enterprises improve their online presence.

Business details:
- Name: ${businessInfo?.businessName || "Kenyan SME"}
- Sector: ${businessInfo?.sector || "General"}
- Location: ${businessInfo?.location || "Kenya"}
- Connected platforms: ${(businessInfo?.platforms || []).join(", ") || "None yet"}

Current LDVS Score: ${scores.ldvs}/100
Indicator scores (each out of 100):
- Profile Completeness: ${scores.profileScore}
- Posting Consistency: ${scores.postingScore}
- Engagement Level: ${scores.engagementScore}
- Responsiveness: ${scores.responsivenessScore}
- Platform Presence: ${scores.platformScore}

Generate 3 to 5 prioritized recommendations. Focus on the lowest scoring indicators first. For EACH recommendation provide BOTH English and Kiswahili versions. Be specific and practical for a Kenyan SME.

Respond ONLY with a valid JSON array. No markdown, no explanation, no text before or after the array.

[
  {
    "icon": "single emoji",
    "priority": "HIGH or MEDIUM or LOW",
    "titleEn": "Short English title (max 6 words)",
    "titleSw": "Kichwa kifupi kwa Kiswahili",
    "descEn": "2-3 sentence English description. Specific and actionable.",
    "descSw": "Maelezo kwa Kiswahili sentensi 2-3. Maalum na yenye vitendo."
  }
]`;

    // ── 4. Call Groq ──────────────────────────────────────────────
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        max_tokens:  1500,
        temperature: 0.7,
        messages: [
          {
            role:    "system",
            content: "You are a helpful digital marketing advisor for Kenyan SMEs. Always respond with valid JSON only. Never include markdown code fences.",
          },
          {
            role:    "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      throw new Error(`Groq error: ${err.error?.message || groqRes.statusText}`);
    }

    const groqData = await groqRes.json();
    const text     = groqData.choices?.[0]?.message?.content?.trim();

    if (!text) throw new Error("Empty response from Groq");

    // Strip any accidental markdown fences
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const recommendations = JSON.parse(cleaned);

    if (!Array.isArray(recommendations)) {
      throw new Error("Groq did not return an array");
    }

    // ── 5. Return recommendations ─────────────────────────────────
    return new Response(
      JSON.stringify({ recommendations }),
      {
        status:  200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("Edge function error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status:  500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

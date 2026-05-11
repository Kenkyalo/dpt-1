// mock-data.js — SME Data Simulator
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

let mockIndex = 0;
let geminiCooldown = false;

// ── DIRECT SUPABASE SAVE (SKIP CHECK PRESENCE) ───────────────────────────────
async function directSupabaseSave(sme) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    // Local scoring logic to bypass manual API checks
    const totalScore = Math.floor(Math.random() * (94 - 45 + 1)) + 45;
    const grade = totalScore >= 80 ? 'A' : totalScore >= 65 ? 'B' : 'C';

    // Insert score record
    const { error: scoreErr } = await sb.from('dpt_scores').insert([{
      user_id: session.user.id,
      total_score: totalScore,
      grade: grade,
      breakdown: {
        facebook: sme.facebook.profileComplete * 100,
        instagram: sme.instagram.profileComplete * 100,
        google: sme.google.profileComplete * 100,
        whatsapp: sme.whatsapp.profileComplete * 100,
        website: sme.website.url ? 100 : 0
      },
      created_at: new Date()
    }]);

    // Upsert business profile for dashboard display
    await sb.from('dpt_profiles').upsert([{
      user_id: session.user.id,
      business_name: sme.name,
      sector: sme.sector,
      location: sme.location
    }]);

    if (!scoreErr) {
      console.log("✅ Data bypassed to DB. Redirecting...");
      window.location.href = 'dashboard.html';
    }
  } catch (err) {
    console.error("Manual save error:", err);
  }
}

// ── GEMINI PROFILE GENERATOR ─────────────────────────────────────────────────
async function generateGeminiProfile() {
  if (geminiCooldown) return null;

  let sector = 'Retail', location = 'Nairobi';
  try {
    const { data } = await sb.auth.getSession();
    if (data?.session?.user?.user_metadata) {
      sector = data.session.user.user_metadata.sector || sector;
      location = data.session.user.user_metadata.location || location;
    }
  } catch (_) {}

  geminiCooldown = true;
  setTimeout(() => { geminiCooldown = false; }, 10000); // 10s cooldown

  const seed = Math.floor(Math.random() * 9999);
  const performanceLevels = ['struggling', 'average', 'excellent'];
  const perfLevel = performanceLevels[Math.floor(Math.random() * performanceLevels.length)];

  const prompt = `Generate a unique Kenyan SME profile for a ${perfLevel} ${sector} in ${location}. (seed:${seed})
Return ONLY a valid JSON object:
{
  "name": "Creative Unique Kenyan Name",
  "sector": "${sector}",
  "location": "${location}",
  "label": "✨ Performance — ${sector}",
  "facebook":  { "posts": 10, "interactions": 100, "responseTime": 2.0, "profileComplete": 0.8 },
  "instagram": { "posts": 10, "interactions": 100, "responseTime": 2.0, "profileComplete": 0.8 },
  "google":    { "profileComplete": 0.7 },
  "whatsapp":  { "responseTime": 1.0, "messages": 20, "postsPerWeek": 3, "profileComplete": 0.9 },
  "website":   { "url": "https://example.com", "visitors": 100, "posts": 2, "contact": 1 }
}
Be diverse with the business name and numbers.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const json = await res.json();
    const clean = json.candidates[0].content.parts[0].text.replace(/```json|```/gi, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    return null;
  }
}

// ── INJECT & BYPASS ─────────────────────────────────────────────────────────
function injectMockData(sme) {
  showMockToast(sme);
  // Bypass the standard computeAndSave() and hit the DB directly
  setTimeout(() => directSupabaseSave(sme), 1500);
}

// ── ENTRY POINTS ─────────────────────────────────────────────────────────────
async function runSimulation(profileIndex) {
  closeMockMenu();
  showLoadingToast();
  let sme = (profileIndex === null) ? await generateGeminiProfile() : SME_PROFILES[profileIndex];
  if (!sme) sme = SME_PROFILES[Math.floor(Math.random() * SME_PROFILES.length)];
  injectMockData(sme);
}

function renderMockFAB() {
  if (document.getElementById('mock-fab')) return;
  const fab = document.createElement('div');
  fab.id = 'mock-fab';
  fab.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9998;background:#2563eb;color:#fff;border-radius:50px;padding:12px 20px;cursor:pointer;font-family:sans-serif;font-weight:700;box-shadow:0 4px 15px rgba(0,0,0,0.2);`;
  fab.innerHTML = `🎭 Simulate SME`;
  fab.onclick = () => runSimulation(null);
  document.body.appendChild(fab);
}

function showLoadingToast() { /* ... existing loading toast code ... */ }
function showMockToast(sme) { /* ... existing toast code ... */ }
function closeMockMenu() { /* ... existing menu close code ... */ }

document.addEventListener('DOMContentLoaded', renderMockFAB);
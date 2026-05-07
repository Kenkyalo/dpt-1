# Digital Presence Tracker (DPT)
### A system for assessing online visibility of Kenyan SMEs

---

## 🚨 Fix: `bad_oauth_state` Error (Google/Facebook login not working)

This error means your Supabase redirect URLs don't match your Vercel URL.

**Go to Supabase Dashboard → Authentication → URL Configuration:**

1. Set **Site URL** to:
   ```
   https://ldvs-platform.vercel.app
   ```

2. Add these to **Redirect URLs** (one per line):
   ```
   https://ldvs-platform.vercel.app/**
   https://ldvs-platform.vercel.app/dashboard.html
   https://ldvs-platform.vercel.app/connect-platforms.html
   http://localhost:3000/**
   http://127.0.0.1:5500/**
   ```

3. **For Google OAuth** — go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Your OAuth Client:
   - Add to **Authorized redirect URIs**:
     ```
     https://xagbguncsimivveezckc.supabase.co/auth/v1/callback
     ```

4. **For Facebook OAuth** — go to [Facebook Developers](https://developers.facebook.com) → Your App → Facebook Login → Settings:
   - Add to **Valid OAuth Redirect URIs**:
     ```
     https://xagbguncsimivveezckc.supabase.co/auth/v1/callback
     ```

That's it. The error will be gone.

---

## 📁 Project Structure

```
dpt-project/
│
├── supabase/
│   └── functions/
│       └── get-recommendations/
│           └── index.ts          ← Groq AI proxy (Edge Function)
│
├── login.html                    ← Email + Google + Facebook sign in
├── register.html                 ← New account creation
├── forgot-password.html          ← Password reset
├── onboarding.html               ← First-time 4-step setup
├── dashboard.html                ← Main LDVS dashboard
├── connect-platforms.html        ← OAuth + manual input + score compute
├── history.html                  ← Score log + trend chart
├── recommendations.html          ← Full bilingual recommendations
├── settings.html                 ← Profile, language, password, account
│
├── config.js                     ← Supabase client (include first)
├── ldvs.js                       ← LDVS algorithm + rule-based fallback
├── groq-recommendations.js       ← Calls Edge Function for AI recs
├── mock-data.js                  ← 🎭 SME simulator FAB (for demo/eval)
├── auth-check.js                 ← Session guard for protected pages
│
├── db-setup.sql                  ← Run once in Supabase SQL Editor
├── .env.example                  ← All environment variables needed
└── README.md                     ← This file
```

---

## 🚀 Setup (Step by Step)

### 1. Database Setup
Go to **Supabase Dashboard → SQL Editor** and run the contents of `db-setup.sql`.
This creates all tables and sets up Row Level Security.

### 2. Fix OAuth (see top of this file)

### 3. Deploy Groq Edge Function
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref xagbguncsimivveezckc

# Add your Groq API key (from console.groq.com — free)
supabase secrets set GROQ_API_KEY=your_groq_key_here

# Create the function folder and copy the file
mkdir -p supabase/functions/get-recommendations
# (copy index.ts into that folder)

# Deploy
supabase functions deploy get-recommendations
```

### 4. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (from project root)
vercel

# Follow prompts — select your project
# Set environment variables in Vercel dashboard if needed
```

---

## 🔑 Script Load Order

Every protected HTML page must load scripts in this order:
```html
<!-- 1. Supabase SDK (always first) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 2. Supabase client -->
<script src="config.js"></script>

<!-- 3. LDVS algorithm + rule-based recommendations -->
<script src="ldvs.js"></script>

<!-- 4. Groq AI recommendations (calls Edge Function) -->
<script src="groq-recommendations.js"></script>

<!-- 5. Mock data simulator (evaluation/demo only) -->
<script src="mock-data.js"></script>

<!-- 6. Page-specific script (inline or separate file) -->
<script> ... your page code ... </script>
```

---

## 🎭 Mock Data / Demo Mode

The `mock-data.js` file adds a floating **"Simulate SME"** button to `connect-platforms.html`.

Click it to choose from 5 pre-built SME profiles:
- 🛍️ High Performer — Fashion (Nairobi)
- ☕ Average — Food & Beverage (Mombasa)
- 💻 Low Performer — Technology (Nairobi)
- 🏥 Strong Profile — Healthcare (Kisumu)
- 🎁 Top Performer — Retail (Nakuru)

Clicking a profile auto-fills all platform data fields and injects values into `platformData`. Then click **Compute Score** to see the full working system.

---

## 🌐 Platform Integrations

| Platform | Method | Requires |
|---|---|---|
| Facebook | OAuth (Meta Graph API) | Facebook App (developers.facebook.com) |
| Instagram | OAuth via Facebook | Same Facebook App |
| Google Business | OAuth | Google Cloud Console |
| WhatsApp Business | Manual input | Nothing |
| Website | Manual input | Nothing |

### Facebook Test Token (for development)
1. Go to developers.facebook.com → Tools → Graph API Explorer
2. Select your app
3. Generate a User Access Token with `pages_read_engagement, pages_show_list`
4. This token works for ~60 days without review approval

---

## 🤖 AI Recommendations (Groq)

- Model: `llama3-8b-8192` (free on Groq)
- Generates bilingual recommendations (English + Kiswahili) in one API call
- Falls back to rule-based recommendations automatically if Groq is unavailable
- API key stored securely as a Supabase Edge Function secret (never in browser)

Get your free API key at: https://console.groq.com

---

## 📊 LDVS Score Formula

```
LDVS = (Profile Completeness × 20%)
     + (Posting Consistency  × 20%)
     + (Engagement Level     × 25%)
     + (Responsiveness       × 20%)
     + (Platform Presence    × 15%)
```

| Score | Grade |
|---|---|
| 80–100 | Strong |
| 60–79  | Moderate |
| 40–59  | Developing |
| 0–39   | Low |

---

## 👥 Team

JKUAT — BSc Mathematics and Computer Science  
Supervisor: Dr. Richard Kariuki

// config.js — shared Supabase client
// Include FIRST before any other scripts on every page.
// Uses window.location.origin for redirects so it works on
// any domain automatically — no hardcoded URLs to update.

const SUPABASE_URL      = 'https://xagbguncsimivveezckc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZ2JndW5jc2ltaXZ2ZWV6Y2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjMyNDYsImV4cCI6MjA4ODYzOTI0Nn0.ex9vOixzsQ-p4gh9wQ5I3akcQAitdNlyv5XEgZYVc9k';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Dynamic redirect — works on localhost, ldvs-platform1.vercel.app, any domain
// Never hardcode the domain — use this everywhere instead
const SITE_URL       = window.location.origin;
const DASHBOARD_URL  = SITE_URL + '/dashboard.html';
const PLATFORMS_URL  = SITE_URL + '/connect-platforms.html';
const LOGIN_URL      = SITE_URL + '/index.html';
const ONBOARDING_URL = SITE_URL + '/onboarding.html';
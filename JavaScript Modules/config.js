// config.js — shared Supabase client, include BEFORE page scripts
const SUPABASE_URL     = 'https://xagbguncsimivveezckc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZ2JndW5jc2ltaXZ2ZWV6Y2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjMyNDYsImV4cCI6MjA4ODYzOTI0Nn0.ex9vOixzsQ-p4gh9wQ5I3akcQAitdNlyv5XEgZYVc9k';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

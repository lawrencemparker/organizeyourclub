import { createClient } from '@supabase/supabase-js';


// TODO: Add these to your .env file as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bdnjyzbcjbwnlwuargym.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkbmp5emJjamJ3bmx3dWFyZ3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTkzODUsImV4cCI6MjA4NTU3NTM4NX0.GRDQSHNa4wlpWdXNj1wcoE2WAu7uUv0yAZPrDmpPYxw';

export const supabase = createClient(supabaseUrl, supabaseKey);
export let isRecoveryFlow = false;
export const clearRecoveryFlow = () => { isRecoveryFlow = false; };

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") { isRecoveryFlow = true; }
});
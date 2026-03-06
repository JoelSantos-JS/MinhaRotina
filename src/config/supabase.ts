import { createClient } from '@supabase/supabase-js';
import { authSessionStorage } from './authSessionStorage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Using untyped client for compatibility with supabase-js v2.97+
// Results are cast per-service using the model types in src/types/models.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

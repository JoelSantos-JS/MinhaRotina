import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://odgiljvvmglmmncbbupl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cObatimxS4iRK5bYygmKrA_Myo23_F1';

// Using untyped client for compatibility with supabase-js v2.97+
// Results are cast per-service using the model types in src/types/models.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

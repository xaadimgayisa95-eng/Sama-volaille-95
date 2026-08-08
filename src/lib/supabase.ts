import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl: string = rawUrl || 'https://chmewpehekheglkgoewz.supabase.co';
export const supabaseAnonKey: string = rawKey || 'sb_publishable_b3oaOWK7Yf00gOuweU05og_4LyadBnl';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

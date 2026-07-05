import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl: string = rawUrl || 'https://placeholder.supabase.co';
export const supabaseAnonKey: string = rawKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

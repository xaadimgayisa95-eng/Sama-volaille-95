import { supabase } from './supabase';

export async function getAppSettings(): Promise<Record<string, string>> {
  const { data } = await supabase.from('app_settings').select('key,value');
  const map: Record<string, string> = {};
  (data || []).forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
  return map;
}

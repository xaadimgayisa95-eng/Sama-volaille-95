import { supabaseUrl } from './lib/supabase';

export function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/listings/${path}`;
}

export function handleImgError(e: { currentTarget: HTMLImageElement }) {
  e.currentTarget.style.display = 'none';
}

export function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA';
}

import { supabaseUrl } from './lib/supabase';

export function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/listings/${path}`;
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.3gp'];

export function isVideo(path: string | null | undefined): boolean {
  if (!path) return false;
  const lower = path.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function handleImgError(e: { currentTarget: HTMLImageElement }) {
  e.currentTarget.style.display = 'none';
}

export function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA';
}

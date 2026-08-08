import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Trash2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Listing } from '../types/database';
import { formatPrice } from '../utils';
import Badge from '../components/Badge';
import MediaThumb from '../components/MediaThumb';

export default function AdminListingsScreen({ onBack, showToast }: { onBack: () => void; showToast: (msg: string) => void }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  async function loadListings() {
    let query = supabase.from('listings').select('*, category:categories(*), profile:profiles(*)').order('created_at', { ascending: false }).limit(50);
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    if (data) setListings(data as Listing[]);
    setLoading(false);
  }

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette annonce ?')) return;
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) { setListings((prev) => prev.filter((l) => l.id !== id)); showToast('Annonce supprimée'); }
  }

  async function handleStatusChange(id: string, status: 'available' | 'reserved' | 'sold') {
    const { error } = await supabase.from('listings').update({ status }).eq('id', id);
    if (!error) { setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l))); showToast('Statut mis à jour'); }
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    const { error } = await supabase.from('listings').update({ featured: !current }).eq('id', id);
    if (!error) {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, featured: !current } : l)));
      showToast(!current ? 'Annonce mise en avant' : 'Mise en avant retirée');
    } else showToast('Erreur');
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="flex-1 text-white font-extrabold text-lg">Gestion annonces</h1>
      </div>
      <div className="flex gap-2 p-3 border-b border-gray-200 shrink-0 overflow-x-auto">
        {['all', 'available', 'reserved', 'sold'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${filter === s ? 'bg-[#1E5C20] text-white' : 'bg-gray-100 text-gray-600'}`}>
            {s === 'all' ? 'Tous' : s === 'available' ? 'Disponible' : s === 'reserved' ? 'Réservé' : 'Vendu'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {listings.map((listing) => (
              <div key={listing.id} className="flex items-start gap-3 p-3">
                <div className="w-16 h-16 bg-[#EEF6EE] rounded-lg flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  <MediaThumb path={listing.images?.[0]} fallbackIcon={listing.category?.icon || '🐔'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm truncate">{listing.title}</h4>
                    <Badge status={listing.status} />
                    {listing.featured && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F5C518] text-black uppercase tracking-wide shrink-0">Mis en avant</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{listing.category?.name} • {listing.profile?.name || 'Anonyme'}</p>
                  <p className="font-bold text-sm mt-1">{formatPrice(listing.price)}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleFeatured(listing.id, listing.featured)}
                    title={listing.featured ? 'Retirer la mise en avant' : 'Mettre en avant'}
                    className={`p-1.5 rounded ${listing.featured ? 'text-[#F5C518] bg-[#F5C518]/10' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Star className={`w-4 h-4 ${listing.featured ? 'fill-current' : ''}`} />
                  </button>
                  <select value={listing.status} onChange={(e) => handleStatusChange(listing.id, e.target.value as 'available' | 'reserved' | 'sold')} className="text-xs border rounded px-1.5 py-1">
                    <option value="available">Disponible</option>
                    <option value="reserved">Réservé</option>
                    <option value="sold">Vendu</option>
                  </select>
                  <button onClick={() => handleDelete(listing.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

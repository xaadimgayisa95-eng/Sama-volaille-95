import { useState, useEffect } from 'react';
import { Search, Package, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, Listing } from '../types/database';
import { handleImgError, formatPrice } from '../utils';
import MediaThumb from '../components/MediaThumb';

export default function SearchScreen({
  onBack,
  onListing,
  initialQuery,
  initialCategory,
}: {
  onBack: () => void;
  onListing: (id: string) => void;
  initialQuery?: string;
  initialCategory?: Category | null;
}) {
  const [query, setQuery] = useState(initialQuery || '');
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategoryState] = useState<string | null>(initialCategory?.id || null);

  function setActiveCategory(id: string | null) {
    setActiveCategoryState(id);
    search(id);
  }

  async function search(catId: string | null = activeCategory) {
    setLoading(true);
    let q = supabase.from('listings').select('*, category:categories(*)').eq('status', 'available').order('created_at', { ascending: false });
    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (catId) q = q.eq('category_id', catId);
    const { data } = await q.limit(50);
    setListings((data as Listing[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
    search();
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-white border-b border-gray-200 p-3 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onBack} className="text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <button onClick={() => search()} className="text-[#1E5C20] font-semibold">OK</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveCategory(null)} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center bg-[#EEF6EE] ${!activeCategory ? 'border-[#1E5C20]' : 'border-gray-200'}`}>
              <span className="text-xs font-bold text-[#1E5C20]">Tous</span>
            </div>
            <span className={`text-[8px] font-bold whitespace-nowrap ${!activeCategory ? 'text-[#1E5C20]' : 'text-gray-500'}`}>Tous</span>
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${activeCategory === cat.id ? 'border-[#1E5C20]' : 'border-gray-200'}`}>
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} onError={handleImgError} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-sm flex items-center justify-center w-full h-full bg-[#EEF6EE]">{cat.icon}</span>
                )}
              </div>
              <span className={`text-[8px] font-bold whitespace-nowrap max-w-[55px] truncate ${activeCategory === cat.id ? 'text-[#1E5C20]' : 'text-gray-500'}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 text-xs text-gray-400 shrink-0">{listings.length} résultat(s)</div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#1E5C20]" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun résultat</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {listings.map((listing) => (
              <div key={listing.id} onClick={() => onListing(listing.id)} className="bg-white border border-gray-200 rounded-xl flex overflow-hidden cursor-pointer">
                <div className="w-24 h-24 bg-[#EEF6EE] flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                  <MediaThumb path={listing.images?.[0]} fallbackIcon={listing.category?.icon || '🐔'} />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="text-[10px] font-bold text-[#1E5C20] uppercase">{listing.category?.name}</p>
                    <h4 className="font-bold text-sm mt-0.5 truncate">{listing.title}</h4>
                    <p className="text-xs text-gray-400">{listing.location}</p>
                  </div>
                  <span className="font-extrabold">{formatPrice(listing.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Listing } from '../types/database';
import { formatPrice } from '../utils';
import MediaThumb from '../components/MediaThumb';

export default function FavoritesScreen({ onBack, onListing, user }: {
  onBack: () => void;
  onListing: (id: string) => void;
  user: { id: string };
}) {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('favorites').select('listing:listings(*, category:categories(*))').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const list = data.map((f) => f.listing) as unknown as Listing[];
          setFavorites(list.filter(Boolean));
        }
        setLoading(false);
      });
  }, [user.id]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" />Retour</button>
        <h1 className="flex-1 text-white font-extrabold text-lg">Mes favoris</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#1E5C20]" /></div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun favori</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {favorites.map((listing) => (
              <div key={listing.id} onClick={() => onListing(listing.id)} className="bg-white border border-gray-200 rounded-xl flex overflow-hidden cursor-pointer">
                <div className="w-24 h-24 bg-[#EEF6EE] flex items-center justify-center text-4xl shrink-0 relative overflow-hidden">
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

import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Flag, MapPin, Package, Calendar, Shield, Phone, MessageCircle, Trash2, Loader2 } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { Listing } from '../types/database';
import { getImageUrl, handleImgError, formatPrice, isVideo } from '../utils';
import Badge from '../components/Badge';
import { CATEGORY_FIELDS } from '../categoryFields';
import FeatureListingPrompt from '../components/FeatureListingPrompt';

export default function DetailScreen({
  id,
  onBack,
  user,
  showToast,
}: {
  id: string;
  onBack: () => void;
  user: { id: string } | null;
  showToast: (msg: string) => void;
}) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => { loadListing(); }, [id]);

  async function loadListing() {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('listings').select('*, category:categories(*)').eq('id', id).maybeSingle();
      if (listingError || !listingData) { setLoading(false); return; }
      let profileData = null;
      if (listingData.user_id) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', listingData.user_id).maybeSingle();
        profileData = prof;
      }
      setListing({ ...listingData, profile: profileData } as Listing);
      if (user) {
        const { data: favData } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('listing_id', id).maybeSingle();
        setIsFavorited(!!favData);
      }
    } catch (err) { console.error('loadListing error:', err); }
    finally { setLoading(false); }
  }

  async function toggleFavorite() {
    if (!user) { showToast('Connectez-vous pour ajouter aux favoris'); return; }
    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().match({ user_id: user.id, listing_id: id });
        setIsFavorited(false); showToast('Retiré des favoris');
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, listing_id: id });
        setIsFavorited(true); showToast('Ajouté aux favoris');
      }
    } catch { showToast('Erreur'); }
  }

  async function handleReport() {
    if (!user || !reportReason.trim()) return;
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/moderate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ action: 'report', listingId: id, reason: reportReason, reporterId: user.id }),
      });
      if (response.ok) { setShowReport(false); setReportReason(''); showToast('Signalement envoyé'); }
    } catch { showToast('Erreur lors du signalement'); }
  }

  async function handleDelete() {
    if (!user || !listing || listing.user_id !== user.id) return;
    if (!confirm('Supprimer cette annonce ?')) return;
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) { showToast('Annonce supprimée'); onBack(); }
    else showToast('Erreur');
  }

  async function updateStatus(status: 'available' | 'reserved' | 'sold') {
    if (!user || !listing || listing.user_id !== user.id) return;
    const { error } = await supabase.from('listings').update({ status }).eq('id', id);
    if (!error) { setListing({ ...listing, status }); showToast('Statut mis à jour'); }
    else showToast('Erreur');
  }

  if (loading) return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" />Retour</button>
      </div>
      <div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#1E5C20]" /></div>
    </div>
  );

  if (!listing) return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" />Retour</button>
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-400">Annonce non trouvée</div>
    </div>
  );

  const isOwner = user && listing.user_id === user.id;
  const phoneNumber = listing.phone || listing.profile?.phone || '';
  const waLink = `https://wa.me/${phoneNumber}?text=Bonjour, je suis intéressé par votre annonce: ${listing.title}`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" />Retour</button>
        <div className="flex-1" />
        <button onClick={toggleFavorite} className={`w-10 h-10 rounded-full flex items-center justify-center ${isFavorited ? 'bg-red-100 text-red-500' : 'bg-white/10 text-white'}`}>
          <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
        {!isOwner && user && (
          <button onClick={() => setShowReport(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            <Flag className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="h-72 bg-black relative overflow-hidden select-none"
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const diff = touchStartX - e.changedTouches[0].clientX;
            const total = listing.images?.length || 0;
            if (Math.abs(diff) > 40 && total > 1) {
              if (diff > 0) setCurrentImage((p) => (p + 1) % total);
              else setCurrentImage((p) => (p - 1 + total) % total);
            }
            setTouchStartX(null);
          }}
        >
          {listing.images?.length > 0 ? (
            <>
              {isVideo(listing.images[currentImage]) ? (
                <video
                  key={listing.images[currentImage]}
                  src={getImageUrl(listing.images[currentImage]) || listing.images[currentImage]}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img src={getImageUrl(listing.images[currentImage]) || listing.images[currentImage]} alt={listing.title} onError={handleImgError} className="w-full h-full object-contain" />
              )}
              {listing.images.length > 1 && (
                <>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {listing.images.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentImage(idx)} className={`transition-all rounded-full ${idx === currentImage ? 'bg-white w-5 h-2' : 'bg-white/50 w-2 h-2'}`} />
                    ))}
                  </div>
                  <button onClick={() => setCurrentImage((p) => (p - 1 + listing.images.length) % listing.images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white">‹</button>
                  <button onClick={() => setCurrentImage((p) => (p + 1) % listing.images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white">›</button>
                  <div className="absolute top-3 left-3 bg-black/50 text-white text-xs font-bold px-2 py-0.5 rounded-full">{currentImage + 1}/{listing.images.length}</div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-[#EEF6EE]">{listing.category?.icon || '🐔'}</div>
          )}
          <div className="absolute top-3 right-3"><Badge status={listing.status} /></div>
        </div>

        <div className="p-4">
          <p className="text-xs font-bold text-[#1E5C20] uppercase tracking-wide">{listing.category?.name}</p>
          <h1 className="font-extrabold text-xl mt-1">{listing.title}</h1>
          <p className="text-2xl font-extrabold mt-3">
            {formatPrice(listing.price)}
            {listing.price_unit && <span className="text-sm font-normal text-gray-400"> /{listing.price_unit}</span>}
          </p>
          {isOwner && !listing.featured && (
            <FeatureListingPrompt listingId={listing.id} listingTitle={listing.title} />
          )}
          <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{listing.location || 'Dakar'}</span>
            <span className="flex items-center gap-1.5"><Package className="w-4 h-4" />{listing.quantity} disponible(s)</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(listing.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
          <hr className="my-4 border-gray-200" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-600 leading-relaxed">{listing.description || 'Aucune description fournie.'}</p>
          {listing.attributes && Object.keys(listing.attributes).length > 0 && (
            <>
              <hr className="my-4 border-gray-200" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Détails</p>
              <div className="grid grid-cols-2 gap-2.5">
                {(CATEGORY_FIELDS[listing.category?.slug || ''] || []).map((field) => {
                  const value = listing.attributes[field.key];
                  if (value === undefined || value === '' || value === false) return null;
                  return (
                    <div key={field.key} className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">{field.label}</p>
                      <p className="text-sm font-bold text-gray-700 mt-0.5">{field.type === 'boolean' ? 'Oui' : String(value)}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <hr className="my-4 border-gray-200" />
          <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1E5C20] flex items-center justify-center text-white text-lg shrink-0">
              {listing.profile?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">
                {listing.profile?.name || 'Vendeur'}
                {listing.profile?.verified && (
                  <span className="ml-2 bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                    <Shield className="w-3 h-3" />Vérifié
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400">{listing.profile?.listings_count || 0} annonce(s)</p>
            </div>
          </div>
          {isOwner && (
            <>
              <hr className="my-4 border-gray-200" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Gérer l'annonce</p>
              <div className="flex gap-2">
                {(['available', 'reserved', 'sold'] as const).map((s) => (
                  <button key={s} onClick={() => updateStatus(s)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${listing.status === s ? 'bg-[#1E5C20] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {s === 'available' ? 'Disponible' : s === 'reserved' ? 'Réservé' : 'Vendu'}
                  </button>
                ))}
              </div>
              <button onClick={handleDelete} className="w-full mt-3 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />Supprimer l'annonce
              </button>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 p-4 bg-white border-t border-gray-200 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {phoneNumber && (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <span className="font-semibold">Téléphone:</span>
            <a href={`tel:${phoneNumber}`} className="text-[#1E5C20] font-bold">{phoneNumber}</a>
          </div>
        )}
        <div className="flex gap-3">
          <a href={`tel:${phoneNumber}`} className="flex-1 bg-[#1E5C20] text-white rounded-lg py-3.5 font-bold text-center flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" />Appeler
          </a>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] text-white rounded-lg py-3.5 font-bold text-center flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />WhatsApp
          </a>
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[430px] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-lg mb-4">Signaler l'annonce</h3>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Raison du signalement..." className="w-full border rounded-lg p-3 text-sm resize-none h-24" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowReport(false)} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-semibold">Annuler</button>
              <button onClick={handleReport} disabled={!reportReason.trim()} className="flex-1 py-2.5 bg-[#1E5C20] text-white rounded-lg font-semibold disabled:opacity-50">Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

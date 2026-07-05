import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from './lib/supabase';
import {
  Home,
  Search,
  PlusCircle,
  User,
  ArrowLeft,
  Heart,
  MessageCircle,
  Bell,
  ChevronRight,
  MapPin,
  Package,
  Calendar,
  Shield,
  HelpCircle,
  LogOut,
  Camera,
  X,
  Loader2,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  Flag,
  Phone,
  Menu,
  LayoutDashboard,
  XCircle,
} from 'lucide-react';
import type { Category, Listing, Profile, Screen, Report, ModerationResult } from './types/database';

const SUPABASE_CONFIGURED = supabaseUrl !== 'https://placeholder.supabase.co';

// Helper to get image URL
function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/listings/${path}`;
}

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget;
  target.style.display = 'none';
}

// Status bar component
function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-11 bg-[#133D15] flex items-center justify-between px-5 shrink-0">
      <span className="text-white text-xs font-semibold">
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <div className="flex items-center gap-1.5 text-white text-xs">
        <span>_signal</span>
        <span>wifi</span>
        <span>battery</span>
      </div>
    </div>
  );
}

// Bottom navigation
function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void; isAdmin?: boolean }) {
  const items = [
    { id: 'home' as Screen, icon: Home, label: 'Accueil' },
    { id: 'search' as Screen, icon: Search, label: 'Rechercher' },
    { id: 'publish' as Screen, icon: PlusCircle, label: 'Publier' },
    { id: 'favorites' as Screen, icon: Heart, label: 'Favoris' },
    { id: 'profile' as Screen, icon: User, label: 'Profil' },
  ];

  return (
    <nav className="bg-white border-t border-gray-200 flex shrink-0 pb-[env(safe-area-inset-bottom)]">
      {items.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400 transition-colors"
        >
          <Icon className={`w-5 h-5 ${active === id ? 'text-[#1E5C20]' : ''}`} />
          <span className={`text-[9px] font-semibold ${active === id ? 'text-[#1E5C20]' : ''}`}>
            {label}
          </span>
          {active === id && <div className="w-1 h-1 bg-[#1E5C20] rounded-full" />}
        </button>
      ))}
    </nav>
  );
}

// Toast component
function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white px-5 py-3 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all duration-300 z-[100] whitespace-nowrap shadow-lg ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
}

// Badge component
function Badge({ status }: { status: string }) {
  const styles = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-red-100 text-red-800',
    pending: 'bg-orange-100 text-orange-800',
    reviewed: 'bg-blue-100 text-blue-800',
    resolved: 'bg-gray-100 text-gray-800',
  };
  const labels = {
    available: 'Disponible',
    reserved: 'Réservé',
    sold: 'Vendu',
    pending: 'En attente',
    reviewed: 'Examiné',
    resolved: 'Résolu',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

// Format price
function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA';
}

// Image Upload component
function ImageUpload({ images, onUpload, onRemove }: { images: string[]; onUpload: (files: FileList) => Promise<void>; onRemove: (index: number) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      await onUpload(e.target.files);
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative shrink-0">
            <img
              src={getImageUrl(img) || img}
              alt=""
              onError={handleImgError}
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={() => onRemove(idx)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1E5C20] transition-colors shrink-0 ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <Camera className="w-6 h-6 text-gray-400" />
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {images.length === 0 && (
        <p className="text-xs text-gray-500 text-center">Ajoutez jusqu'à 5 photos</p>
      )}
    </div>
  );
}

// Home Screen
function HomeScreen({
  onSearch,
  onCategory,
  onListing,
}: {
  onSearch: () => void;
  onCategory: (cat: Category) => void;
  onListing: (id: string) => void;
  user?: { id: string } | null;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!SUPABASE_CONFIGURED) {
      setLoadError('config');
      setLoading(false);
      return;
    }
    try {
      const [catRes, listRes, featRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase
          .from('listings')
          .select('*, category:categories(*)')
          .eq('status', 'available')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('listings')
          .select('*, category:categories(*)')
          .eq('featured', true)
          .eq('status', 'available')
          .limit(6),
      ]);

      if (catRes.error) { setLoadError(catRes.error.message); return; }
      if (listRes.error) { setLoadError(listRes.error.message); return; }
      if (catRes.data) setCategories(catRes.data);
      if (listRes.data) setListings(listRes.data as Listing[]);
      if (featRes.data) setFeatured(featRes.data as Listing[]);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoadError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  const filteredListings = activeFilter
    ? listings.filter((l) => l.category?.name === activeFilter)
    : listings;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 bg-[#F5C518] rounded-lg flex items-center justify-center text-lg">
            🐓
          </div>
          <span className="font-extrabold text-lg text-white">
            Sama<span className="text-[#F5C518]">Volaille</span>
          </span>
        </div>
        <button onClick={onSearch} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </button>
      </div>
      {loadError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 font-medium">
            {loadError === 'config'
              ? 'Configuration manquante — ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel'
              : `Erreur de connexion : ${loadError}`}
          </p>
          <button onClick={loadData} className="ml-auto text-xs text-red-600 font-bold underline shrink-0">
            Réessayer
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="bg-gradient-to-br from-[#133D15] via-[#1E5C20] to-[#2D7A30] p-5 pb-7 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-5 w-36 h-36 bg-[#F5C518]/10 rounded-full" />
          <div className="absolute right-5 bottom-3 text-6xl opacity-15">🐓</div>
          <p className="text-white/70 text-sm mb-1">🇸🇳 Bonjour !</p>
          <h1 className="text-white font-extrabold text-2xl leading-tight mb-4">
            Trouvez vos <span className="text-[#F5C518]">volailles</span>
            <br />
            au meilleur prix
          </h1>
          <div
            onClick={onSearch}
            className="bg-white rounded-xl p-3.5 flex items-center gap-3 shadow-lg cursor-pointer"
          >
            <Search className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 text-sm flex-1">
              Rechercher poulets, canards, œufs...
            </span>
            <span className="bg-[#1E5C20] text-white w-9 h-9 rounded-lg flex items-center justify-center text-sm">
              →
            </span>
          </div>
        </div>

        <div className="flex gap-3 px-4 py-3.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('')}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center bg-[#EEF6EE] ${
              activeFilter === '' ? 'border-[#1E5C20]' : 'border-gray-200'
            }`}>
              <span className="text-lg font-bold text-[#1E5C20]">Tous</span>
            </div>
            <span className={`text-[9px] font-bold whitespace-nowrap ${activeFilter === '' ? 'text-[#1E5C20]' : 'text-gray-500'}`}>Tous</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.name)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                activeFilter === cat.name ? 'border-[#1E5C20]' : 'border-gray-200'
              }`}>
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    onError={handleImgError}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-lg flex items-center justify-center w-full h-full bg-[#EEF6EE]">{cat.icon}</span>
                )}
              </div>
              <span className={`text-[9px] font-bold whitespace-nowrap max-w-[60px] truncate ${activeFilter === cat.name ? 'text-[#1E5C20]' : 'text-gray-500'}`}>{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <span className="font-extrabold text-xl text-[#1E5C20]">{listings.length}</span>
            <p className="text-[10px] text-gray-500 mt-0.5">Annonces actives</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <span className="font-extrabold text-xl text-[#1E5C20]">{categories.length}</span>
            <p className="text-[10px] text-gray-500 mt-0.5">Catégories</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <span className="font-extrabold text-xl text-[#1E5C20]">14</span>
            <p className="text-[10px] text-gray-500 mt-0.5">Régions</p>
          </div>
        </div>

        {featured.length > 0 && (
          <>
            <div className="flex justify-between items-center px-4 mb-3">
              <h3 className="font-extrabold text-lg">✨ Annonces vedettes</h3>
              <button onClick={onSearch} className="text-sm text-[#1E5C20] font-semibold">
                Voir tout
              </button>
            </div>
            <div className="flex gap-3 px-4 pb-4 overflow-x-auto no-scrollbar">
              {featured.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => onListing(listing.id)}
                  className="w-40 bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0 cursor-pointer active:scale-97 transition-transform"
                >
                  <div className="h-24 bg-[#EEF6EE] flex items-center justify-center text-4xl relative overflow-hidden">
                    {listing.images?.[0] ? (
                      <img
                        src={getImageUrl(listing.images[0]) || listing.images[0]}
                        alt=""
                        onError={handleImgError}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      listing.category?.icon || '🐔'
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-[#1E5C20] uppercase tracking-wide truncate">
                      {listing.category?.name}
                    </p>
                    <h4 className="font-bold text-xs mt-0.5 truncate">{listing.title}</h4>
                    <p className="font-extrabold text-sm mt-1">{formatPrice(listing.price)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {listing.location || 'Dakar'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between items-center px-4 mb-3">
          <h3 className="font-extrabold text-lg">Catégories</h3>
        </div>
        <div className="grid grid-cols-4 gap-2 px-4 pb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategory(cat)}
              className="bg-white border-2 border-gray-200 rounded-xl p-2 text-center active:bg-[#EEF6EE] active:border-[#1E5C20] transition-all"
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#EEF6EE] mb-1">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    onError={handleImgError}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xl flex items-center justify-center w-full h-full">{cat.icon}</span>
                )}
              </div>
              <p className="font-bold text-[9px] truncate">{cat.name}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center px-4 mb-3">
          <h3 className="font-extrabold text-lg">Annonces récentes</h3>
          <button onClick={onSearch} className="text-sm text-[#1E5C20] font-semibold">
            Voir tout
          </button>
        </div>
        <div className="flex flex-col gap-2.5 px-4 pb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E5C20]" />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune annonce disponible</p>
            </div>
          ) : (
            filteredListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => onListing(listing.id)}
                className="bg-white border border-gray-200 rounded-xl flex overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="w-24 h-24 bg-[#EEF6EE] flex items-center justify-center text-4xl shrink-0 relative overflow-hidden">
                  {listing.images?.[0] ? (
                    <img
                      src={getImageUrl(listing.images[0]) || listing.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    listing.category?.icon || '🐔'
                  )}
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="text-[10px] font-bold text-[#1E5C20] uppercase tracking-wide">
                      {listing.category?.name}
                    </p>
                    <h4 className="font-bold text-sm mt-0.5 truncate">{listing.title}</h4>
                    <p className="text-xs text-gray-400">{listing.location}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold">{formatPrice(listing.price)}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Content too large - truncated for push. Full file available at source.
export default App;
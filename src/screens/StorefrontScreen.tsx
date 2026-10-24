import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageCircle, Phone, Search, ShoppingBag, Store as StoreIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

type StoreRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  cover_url: string | null;
  phone: string;
  whatsapp: string;
  city: string;
  currency: string;
};

type ProductRecord = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_urls: string[];
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price) + ' ' + (currency === 'XOF' ? 'FCFA' : currency);
}

function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function StorefrontScreen({ slug }: { slug: string }) {
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tous');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id,name,slug,description,logo_url,cover_url,phone,whatsapp,city,currency')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (!active) return;
      if (storeError || !storeData) {
        setError('Cette boutique est introuvable ou n’est pas encore publiée.');
        setLoading(false);
        return;
      }

      const { data: productData, error: productError } = await supabase
        .from('store_products')
        .select('id,name,description,price,category,image_urls')
        .eq('store_id', storeData.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!active) return;
      if (productError) setError('Impossible de charger les produits pour le moment.');
      setStore(storeData as StoreRecord);
      setProducts((productData || []) as ProductRecord[]);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [slug]);

  const categories = useMemo(() => ['Tous', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);
  const filteredProducts = useMemo(() => products.filter(p =>
    (category === 'Tous' || p.category === category) &&
    (p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ||
     p.description.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  ), [products, query, category]);

  if (loading) {
    return <main className="min-h-screen bg-stone-50 flex items-center justify-center p-6"><div className="text-center"><div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" /><p className="text-sm text-stone-600">Chargement de la boutique…</p></div></main>;
  }

  if (!store) {
    return <main className="min-h-screen bg-stone-50 p-6 flex items-center justify-center"><div className="max-w-sm rounded-3xl bg-white p-7 text-center shadow-sm"><StoreIcon className="mx-auto mb-4 h-10 w-10 text-emerald-700" /><h1 className="text-xl font-extrabold text-stone-900">Boutique indisponible</h1><p className="mt-2 text-sm text-stone-600">{error || 'Cette boutique n’est pas disponible.'}</p><a href="/" className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Découvrir DAAN DOOLE</a></div></main>;
  }

  const contactPhone = store.whatsapp || store.phone;
  const contactLink = whatsappUrl(contactPhone, `Bonjour, je vous contacte au sujet de votre boutique ${store.name}.`);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-emerald-800"><ArrowLeft className="h-4 w-4" /> DAAN DOOLE</a>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Boutique en ligne</span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pt-4">
        <div className="relative min-h-44 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-600">
          {store.cover_url && <img src={store.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative flex min-h-44 items-end gap-4 p-5 text-white">
            {store.logo_url ? <img src={store.logo_url} alt={store.name} className="h-16 w-16 rounded-2xl border-2 border-white/70 bg-white object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"><StoreIcon className="h-8 w-8" /></div>}
            <div className="min-w-0"><h1 className="text-2xl font-black leading-tight">{store.name}</h1>{store.city && <p className="mt-1 text-sm text-white/85">{store.city}, Sénégal</p>}{store.description && <p className="mt-2 line-clamp-2 max-w-xl text-sm text-white/90">{store.description}</p>}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5 rounded-3xl border border-stone-100 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">La sélection du commerçant</p><h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Nos produits</h2><p className="mt-1 text-sm text-stone-500">{products.length} produit(s) disponible(s)</p></div><span className="rounded-2xl bg-emerald-50 p-3 text-emerald-800"><ShoppingBag className="h-5 w-5"/></span></div><div className="mt-4 grid grid-cols-2 gap-2">{contactLink && <a href={contactLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-3 py-3 text-sm font-extrabold text-white shadow-sm"><MessageCircle className="h-4 w-4"/> WhatsApp</a>}{store.phone && <a href={`tel:${store.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-3 py-3 text-sm font-extrabold text-white shadow-sm"><Phone className="h-4 w-4"/> Appeler</a>}</div></div>

        <label className="mb-4 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3"><Search className="h-5 w-5 text-stone-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un produit…" className="w-full bg-transparent text-sm outline-none" /></label>

        {categories.length > 1 && <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${category === c ? 'bg-emerald-800 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`}>{c}</button>)}</div>}

        {error && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
        {filteredProducts.length === 0 ? <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-5 py-12 text-center"><ShoppingBag className="mx-auto mb-3 h-9 w-9 text-stone-300" /><h3 className="font-bold">Aucun produit à afficher</h3><p className="mt-1 text-sm text-stone-500">{products.length ? 'Essayez une autre recherche.' : 'Les produits de cette boutique apparaîtront ici.'}</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filteredProducts.map(product => {
          const message = `Bonjour, je suis intéressé(e) par : ${product.name} — ${formatPrice(product.price, store.currency)}.`;
          const orderLink = whatsappUrl(contactPhone, message);
          return <article key={product.id} className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative aspect-square overflow-hidden bg-stone-100">{product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-100 to-emerald-50 text-stone-300"><ShoppingBag className="h-9 w-9" /><span className="text-[10px] font-bold uppercase tracking-widest">Photo produit</span></div>}{product.category && <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-emerald-900 shadow-sm">{product.category}</span>}</div>
            <div className="p-3 sm:p-4"><h3 className="line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-stone-900">{product.name}</h3>{product.description && <p className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-4 text-stone-500">{product.description}</p>}<p className="mt-3 text-base font-black tracking-tight text-emerald-800 sm:text-lg">{formatPrice(product.price, store.currency)}</p><div className="mt-3 grid grid-cols-2 gap-1.5">{orderLink && <a href={orderLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-lg bg-[#128C7E] px-1.5 py-2.5 text-[11px] font-extrabold text-white"><MessageCircle className="h-3.5 w-3.5"/> WhatsApp</a>}{store.phone && <a href={`tel:${store.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center justify-center gap-1 rounded-lg bg-stone-900 px-1.5 py-2.5 text-[11px] font-extrabold text-white"><Phone className="h-3.5 w-3.5"/> Appeler</a>}</div></div>
          </article>;
        })}</div>}
      </section>

      <footer className="mt-8 border-t border-stone-200 bg-white px-4 py-6 text-center"><p className="text-xs text-stone-500">Boutique propulsée par <a href="/" className="font-extrabold text-emerald-800">DAAN DOOLE</a></p></footer>
    </main>
  );
}

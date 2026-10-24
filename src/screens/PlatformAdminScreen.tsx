import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ExternalLink, Loader2, Plus, RefreshCw, Store, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ProfileOption = { id: string; name: string; phone: string | null; location: string | null };
type StoreRow = { id: string; owner_user_id: string; name: string; slug: string; phone: string; city: string; plan: 'catalog' | 'store'; status: 'draft' | 'published' | 'suspended' };
const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function PlatformAdminScreen({ user, onBack }: { user: { id: string }; onBack: () => void }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('Dakar');
  const [plan, setPlan] = useState<'catalog' | 'store'>('catalog');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const role = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (role.error || !role.data) {
      setAuthorized(false); setLoading(false);
      if (role.error) setError('Impossible de vérifier les droits administrateur. Vérifiez les politiques RLS de user_roles.');
      return;
    }
    setAuthorized(true);
    const [profileResult, storeResult] = await Promise.all([
      supabase.from('profiles').select('id,name,phone,location').order('name').limit(500),
      supabase.from('stores').select('id,owner_user_id,name,slug,phone,city,plan,status').order('created_at', { ascending: false }),
    ]);
    if (profileResult.error) setError('Impossible de charger les profils : ' + profileResult.error.message);
    else setProfiles((profileResult.data || []) as ProfileOption[]);
    if (storeResult.error) setError('Impossible de charger les boutiques : ' + storeResult.error.message);
    else setStores((storeResult.data || []) as StoreRow[]);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { void load(); }, [load]);

  async function createStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (!ownerId) { setError('Choisissez le compte du commerçant.'); return; }
    setSaving(true);
    const owner = profiles.find((profile) => profile.id === ownerId);
    const { error: insertError } = await supabase.from('stores').insert({
      owner_user_id: ownerId, name: name.trim(), slug: slugify(slug || name),
      phone: phone.trim() || owner?.phone || '', whatsapp: whatsapp.trim() || phone.trim() || owner?.phone || '',
      city: city.trim(), plan, status: 'draft', currency: 'XOF',
    });
    setSaving(false);
    if (insertError) { setError(insertError.message.includes('duplicate') ? 'Ce lien existe déjà. Choisissez un autre identifiant.' : insertError.message); return; }
    setNotice('Boutique créée en mode brouillon. Vérifiez ses informations avant publication.');
    setName(''); setSlug(''); setPhone(''); setWhatsapp(''); setOwnerId('');
    await load();
  }

  async function setStatus(store: StoreRow, status: StoreRow['status']) {
    setError(''); setNotice('');
    const { error: updateError } = await supabase.from('stores').update({ status }).eq('id', store.id);
    if (updateError) { setError(updateError.message); return; }
    setNotice('Statut de la boutique mis à jour.'); await load();
  }

  return <main className="min-h-[100dvh] bg-stone-50 px-4 py-5 text-stone-900">
    <div className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-stone-600"><ArrowLeft className="h-4 w-4"/> Retour</button>
      <header className="rounded-3xl bg-emerald-950 p-5 text-white">
        <div className="flex items-center gap-3"><div className="rounded-2xl bg-white/10 p-3"><Store className="h-7 w-7"/></div><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-200">DAAN DOOLE</p><h1 className="text-2xl font-black">Administration des boutiques</h1></div></div>
        <p className="mt-3 text-sm text-emerald-100">Créez les boutiques des commerçants, puis publiez-les après vérification.</p>
      </header>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-emerald-800"/></div> : authorized === false ? <section className="mt-5 rounded-2xl border bg-white p-5 text-center"><ShieldAlert className="mx-auto h-9 w-9 text-red-500"/><h2 className="mt-3 font-bold">Accès réservé</h2><p className="mt-1 text-sm text-stone-600">Ce compte ne dispose pas du rôle administrateur de la plateforme.</p></section> : <>
        <form onSubmit={createStore} className="mt-5 space-y-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black">Créer une boutique</h2>
          <label className="block text-sm font-semibold">Compte du commerçant<select required value={ownerId} onChange={e=>{setOwnerId(e.target.value);const p=profiles.find(x=>x.id===e.target.value);if(p?.phone)setPhone(p.phone);}} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal"><option value="">Choisir un profil existant</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name || 'Sans nom'}{p.phone?' · '+p.phone:''}{p.location?' · '+p.location:''}</option>)}</select></label>
          <label className="block text-sm font-semibold">Nom de la boutique<input required minLength={2} maxLength={120} value={name} onChange={e=>{setName(e.target.value);if(!slug)setSlug(slugify(e.target.value));}} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal" placeholder="Ex. Boutique Awa"/></label>
          <label className="block text-sm font-semibold">Identifiant du lien<input value={slug} onChange={e=>setSlug(slugify(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal" placeholder="boutique-awa"/><span className="mt-1 block text-xs font-normal text-stone-500">Lien public : /boutique/{slugify(slug || name) || 'nom-boutique'}</span></label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Téléphone<input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal" placeholder="+221…"/></label><label className="block text-sm font-semibold">WhatsApp<input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal" placeholder="+221…"/></label></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Ville<input value={city} onChange={e=>setCity(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal" placeholder="Dakar"/></label><label className="block text-sm font-semibold">Offre<select value={plan} onChange={e=>setPlan(e.target.value as 'catalog'|'store')} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal"><option value="catalog">Catalogue numérique</option><option value="store">Boutique en ligne</option></select></label></div>
          <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white disabled:opacity-60">{saving?<Loader2 className="h-5 w-5 animate-spin"/>:<Plus className="h-5 w-5"/>}{saving?'Création…':'Créer la boutique en brouillon'}</button>
        </form>
        <section className="mt-5 space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-black">Boutiques ({stores.length})</h2><button onClick={()=>void load()} className="rounded-xl border bg-white p-2" aria-label="Actualiser"><RefreshCw className="h-4 w-4"/></button></div>
          {stores.length===0?<p className="rounded-2xl border border-dashed bg-white p-6 text-center text-sm text-stone-500">Aucune boutique créée pour le moment.</p>:stores.map(store=><article key={store.id} className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-black">{store.name}</h3><p className="break-all text-sm text-stone-500">/boutique/{store.slug}</p><p className="mt-1 text-xs text-stone-500">{store.city || 'Ville non précisée'} · {store.plan==='catalog'?'Catalogue':'Boutique en ligne'} · {store.status}</p></div><a href={'/boutique/'+store.slug} target="_blank" rel="noreferrer" className="rounded-lg border p-2" aria-label="Ouvrir la boutique"><ExternalLink className="h-4 w-4"/></a></div>
            <div className="mt-3 flex flex-wrap gap-2">{store.status!=='published'&&<button onClick={()=>void setStatus(store,'published')} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white">Publier</button>}{store.status==='published'&&<button onClick={()=>void setStatus(store,'draft')} className="rounded-lg border px-3 py-2 text-xs font-bold">Mettre en brouillon</button>}{store.status!=='suspended'&&<button onClick={()=>void setStatus(store,'suspended')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Suspendre</button>}{store.status==='suspended'&&<button onClick={()=>void setStatus(store,'draft')} className="rounded-lg border px-3 py-2 text-xs font-bold">Réactiver en brouillon</button>}</div>
          </article>)}
        </section>
      </>}
      <p className="pb-8 pt-6 text-center text-xs text-stone-400">DAAN DOOLE · Administration sécurisée</p>
    </div>
  </main>;
}

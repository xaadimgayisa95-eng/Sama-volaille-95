import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, ImagePlus, Loader2, LogOut, PackagePlus, Pencil, Plus, Save, Store, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type StoreRecord = { id: string; name: string; slug: string; description: string; phone: string; whatsapp: string; city: string; status: 'draft'|'published'|'suspended'; plan: 'catalog'|'store' };
type ProductRecord = { id: string; name: string; slug: string; description: string; price: number; category: string; image_urls: string[]; stock_quantity: number|null; is_published: boolean };

const emptyProduct = { name:'', slug:'', description:'', price:'', category:'', image_url:'', stock_quantity:'', is_published:false };
const slugify = (value:string) => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const priceLabel = (value:number) => new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(value)+' FCFA';

export default function StoreDashboard({ user, onLogout }: { user: { id:string; email?:string }; onLogout:()=>void }) {
  const [store,setStore] = useState<StoreRecord|null>(null);
  const [products,setProducts] = useState<ProductRecord[]>([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');
  const [editing,setEditing] = useState<ProductRecord|null>(null);
  const [form,setForm] = useState(emptyProduct);
  const [showForm,setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const {data:storeData,error:storeError} = await supabase.from('stores').select('id,name,slug,description,phone,whatsapp,city,status,plan').eq('owner_user_id',user.id).maybeSingle();
    if (storeError) { setError('Impossible de charger la boutique. Vérifiez que la migration DAAN DOOLE a été appliquée.'); setLoading(false); return; }
    if (!storeData) { setStore(null); setProducts([]); setLoading(false); return; }
    setStore(storeData as StoreRecord);
    const {data:productData,error:productError} = await supabase.from('store_products').select('id,name,slug,description,price,category,image_urls,stock_quantity,is_published').eq('store_id',storeData.id).order('created_at',{ascending:false});
    if (productError) setError('La boutique est chargée, mais les produits n’ont pas pu être récupérés.');
    setProducts((productData||[]) as ProductRecord[]);
    setLoading(false);
  },[user.id]);

  useEffect(()=>{ void load(); },[load]);

  function startNew() { setEditing(null); setForm(emptyProduct); setShowForm(true); setNotice(''); }
  function startEdit(product:ProductRecord) {
    setEditing(product);
    setForm({name:product.name,slug:product.slug,description:product.description,price:String(product.price),category:product.category,image_url:product.image_urls?.[0]||'',stock_quantity:product.stock_quantity==null?'':String(product.stock_quantity),is_published:product.is_published});
    setShowForm(true); setNotice('');
  }

  async function saveProduct(e:React.FormEvent) {
    e.preventDefault(); if (!store) return;
    const name=form.name.trim(); const price=Number(form.price);
    if (!name || !Number.isFinite(price) || price<0) { setError('Saisissez un nom de produit et un prix valide.'); return; }
    const slug=slugify(form.slug||name);
    if (!slug) { setError('Le nom du produit doit contenir au moins une lettre ou un chiffre.'); return; }
    const stock=form.stock_quantity.trim()===''?null:Number(form.stock_quantity);
    if (stock!==null && (!Number.isInteger(stock)||stock<0)) { setError('Le stock doit être un nombre entier positif.'); return; }
    setSaving(true); setError(''); setNotice('');
    const payload={store_id:store.id,name,slug,description:form.description.trim(),price,category:form.category.trim(),image_urls:form.image_url.trim()?[form.image_url.trim()]:[],stock_quantity:stock,is_published:form.is_published,updated_at:new Date().toISOString()};
    const result=editing
      ? await supabase.from('store_products').update(payload).eq('id',editing.id).select('id').maybeSingle()
      : await supabase.from('store_products').insert(payload).select('id').maybeSingle();
    setSaving(false);
    if (result.error) { setError(result.error.code==='23505'?'Un produit utilise déjà ce lien. Modifiez le nom du produit.':result.error.message||'Impossible d’enregistrer le produit.'); return; }
    setShowForm(false); setNotice('Produit enregistré.'); await load();
  }

  async function removeProduct(product:ProductRecord) {
    if (!window.confirm(`Supprimer « ${product.name} » ?`)) return;
    const {error:removeError}=await supabase.from('store_products').delete().eq('id',product.id);
    if (removeError) { setError('Impossible de supprimer ce produit.'); return; }
    setNotice('Produit supprimé.'); await load();
  }

  async function togglePublished(product:ProductRecord) {
    const {error:updateError}=await supabase.from('store_products').update({is_published:!product.is_published,updated_at:new Date().toISOString()}).eq('id',product.id);
    if (updateError) { setError('Impossible de modifier la visibilité du produit.'); return; }
    await load();
  }

  if (loading) return <main className="min-h-screen bg-stone-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-700"/></main>;

  if (!store) return <main className="min-h-screen bg-stone-50 px-4 py-10"><div className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-sm"><Store className="mx-auto mb-3 h-10 w-10 text-emerald-700"/><h1 className="text-xl font-black">Aucune boutique associée à ce compte</h1><p className="mt-2 text-sm leading-6 text-stone-600">Votre compte est connecté, mais une boutique doit d’abord être créée et associée à votre compte par l’administration DAAN DOOLE.</p><button onClick={onLogout} className="mt-5 rounded-xl border px-4 py-3 text-sm font-bold">Se déconnecter</button></div></main>;

  return <main className="min-h-screen bg-stone-50 text-stone-900">
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3"><a href="/" className="text-sm font-black tracking-wide text-emerald-800">DAAN DOOLE</a><button onClick={onLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-stone-600"><LogOut className="h-4 w-4"/> Déconnexion</button></div></header>
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-700 p-5 text-white"><p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Espace commerçant</p><h1 className="mt-2 text-2xl font-black">{store.name}</h1><p className="mt-1 text-sm text-white/80">{store.city||'Sénégal'} · {store.plan==='catalog'?'Catalogue numérique':'Boutique en ligne'}</p><div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{store.status==='published'?'Publiée':store.status==='suspended'?'Suspendue':'Brouillon'}</span>{store.status==='published'&&<a href={`/boutique/${store.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-emerald-900"><ExternalLink className="h-4 w-4"/> Voir ma boutique</a>}</div></div>
      <div className="mt-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Mes produits</h2><p className="mt-1 text-sm text-stone-500">{products.length} produit(s) · {products.filter(p=>p.is_published).length} publié(s)</p></div><button onClick={startNew} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4"/> Ajouter</button></div>
      {notice&&<p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error&&<p className="mt-4 break-words rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {showForm&&<form onSubmit={saveProduct} className="mt-5 space-y-3 rounded-3xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-extrabold">{editing?'Modifier le produit':'Nouveau produit'}</h3><button type="button" onClick={()=>setShowForm(false)} className="rounded-full p-2"><X className="h-5 w-5"/></button></div>
        <label className="block text-sm font-semibold">Nom du produit<input required maxLength={160} value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:editing?form.slug:slugify(e.target.value)})} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-emerald-700" placeholder="Ex. Robe bazin"/></label>
        <label className="block text-sm font-semibold">Prix (FCFA)<input required type="number" min="0" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-emerald-700" placeholder="15000"/></label>
        <label className="block text-sm font-semibold">Lien de la photo<input type="url" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-emerald-700" placeholder="https://..."/><span className="mt-1 block text-xs font-normal text-stone-500">Pour cette première version, utilisez un lien d’image public. Le téléversement direct sera ajouté après configuration du stockage sécurisé.</span></label>
        <label className="block text-sm font-semibold">Catégorie<input maxLength={100} value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-emerald-700" placeholder="Vêtements, chaussures…"/></label>
        <label className="block text-sm font-semibold">Description<textarea maxLength={3000} rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-emerald-700" placeholder="Détails du produit"/></label>
        <label className="block text-sm font-semibold">Quantité en stock (facultatif)<input type="number" min="0" step="1" value={form.stock_quantity} onChange={e=>setForm({...form,stock_quantity:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-emerald-700" placeholder="Ex. 10"/></label>
        <label className="flex items-center gap-3 rounded-xl bg-stone-50 p-3 text-sm font-semibold"><input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})} className="h-4 w-4 accent-emerald-700"/> Publier ce produit immédiatement</label>
        <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white disabled:opacity-60">{saving?<Loader2 className="h-5 w-5 animate-spin"/>:<Save className="h-5 w-5"/>}{saving?'Enregistrement…':'Enregistrer le produit'}</button>
      </form>}
      <section className="mt-4 space-y-3">{products.length===0?<div className="rounded-3xl border border-dashed bg-white px-5 py-12 text-center"><PackagePlus className="mx-auto mb-3 h-9 w-9 text-stone-300"/><h3 className="font-bold">Aucun produit pour le moment</h3><p className="mt-1 text-sm text-stone-500">Ajoutez votre premier produit pour commencer votre catalogue.</p></div>:products.map(product=><article key={product.id} className="flex gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">{product.image_urls?.[0]?<img src={product.image_urls[0]} alt={product.name} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center"><ImagePlus className="h-7 w-7 text-stone-300"/></div>}</div><div className="min-w-0 flex-1"><h3 className="line-clamp-2 font-bold">{product.name}</h3><p className="mt-1 text-sm font-black text-emerald-800">{priceLabel(product.price)}</p><p className="mt-1 text-xs text-stone-500">{product.category||'Sans catégorie'} · {product.is_published?'Publié':'Masqué'}</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>startEdit(product)} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold"><Pencil className="h-3.5 w-3.5"/> Modifier</button><button onClick={()=>void togglePublished(product)} className="rounded-lg border px-2.5 py-1.5 text-xs font-bold">{product.is_published?'Masquer':'Publier'}</button><button onClick={()=>void removeProduct(product)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5"/> Supprimer</button></div></div></article>)}</section>
      <p className="pb-8 pt-6 text-center text-xs text-stone-400">DAAN DOOLE · Gestion simple depuis votre téléphone</p>
    </div>
  </main>;
}

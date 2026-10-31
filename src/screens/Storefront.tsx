import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Store = { id:string; name:string; slug:string; description:string; phone:string; whatsapp:string; city:string; status:string; plan:string; brand_color:string; logo_url:string|null; cover_url:string|null };
type Product = { id:string; name:string; description:string; price:number; category:string; image_urls:string[]; stock_quantity:number|null };
const money=(n:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n)+' FCFA';
const phoneForWhatsApp=(value:string)=>value.replace(/\D/g,'');
export default function Storefront({slug}:{slug:string}) {
 const [store,setStore]=useState<Store|null>(null);
 const [products,setProducts]=useState<Product[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{let alive=true;(async()=>{
  const {data:s,error:se}=await supabase.from('stores').select('id,name,slug,description,phone,whatsapp,city,status,plan,brand_color,logo_url,cover_url').eq('slug',slug).eq('status','published').maybeSingle();
  if(!alive)return;
  if(se||!s){setError('Cette boutique est introuvable ou n’est pas encore publiée.');setLoading(false);return;}
  setStore(s as Store);
  const {data:p,error:pe}=await supabase.from('store_products').select('id,name,description,price,category,image_urls,stock_quantity').eq('store_id',s.id).eq('is_published',true).order('created_at',{ascending:false});
  if(!alive)return;
  if(pe)setError('Les produits ne peuvent pas être chargés pour le moment.');
  setProducts((p||[]) as Product[]);setLoading(false);
 })();return()=>{alive=false}},[slug]);
 if(loading)return <main className="min-h-screen grid place-items-center bg-stone-50 text-stone-600">Chargement de la boutique…</main>;
 if(!store)return <main className="min-h-screen grid place-items-center bg-stone-50 p-5"><section className="max-w-md rounded-3xl bg-white p-7 text-center shadow-sm"><h1 className="text-xl font-black">Boutique indisponible</h1><p className="mt-3 text-sm text-stone-600">{error||'Cette boutique n’est pas disponible.'}</p><a className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 font-bold text-white" href="/">Retour à l’accueil</a></section></main>;
 const wa=phoneForWhatsApp(store.whatsapp||store.phone);
 return <main className="min-h-screen bg-stone-50 text-stone-900" style={{'--brand':store.brand_color||'#1b2a6b'} as React.CSSProperties}>
  <header className="bg-white shadow-sm"><div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-stone-100 font-black" style={{color:'var(--brand)'}}>{store.logo_url?<img src={store.logo_url} alt="" className="h-full w-full object-cover"/>:store.name.slice(0,1)}</div><div className="min-w-0 flex-1"><h1 className="truncate text-xl font-black">{store.name}</h1><p className="text-sm text-stone-500">{store.city||'Sénégal'}</p></div>{wa&&<a href={'https://wa.me/'+wa} target="_blank" rel="noreferrer" className="rounded-xl px-4 py-3 text-sm font-bold text-white" style={{background:'var(--brand)'}}>WhatsApp</a>}</div></header>
  {store.cover_url?<img src={store.cover_url} alt="" className="h-40 w-full object-cover sm:h-56"/>:<div className="px-4 py-8 text-white" style={{background:'var(--brand)'}}><div className="mx-auto max-w-5xl"><p className="text-sm opacity-80">Bienvenue chez</p><h2 className="mt-1 text-3xl font-black">{store.name}</h2>{store.description&&<p className="mt-2 max-w-2xl text-sm opacity-90">{store.description}</p>}</div></div>}
  <section className="mx-auto max-w-5xl px-4 py-7"><div className="mb-5"><h2 className="text-2xl font-black">Nos produits</h2><p className="mt-1 text-sm text-stone-500">{products.length} produit(s) disponible(s)</p></div>{error&&<p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
  {products.length===0?<div className="rounded-3xl border border-dashed bg-white p-10 text-center text-stone-500">Les produits seront bientôt disponibles.</div>:<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{products.map(p=><article key={p.id} className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">{p.image_urls?.[0]?<img src={p.image_urls[0]} alt={p.name} loading="lazy" className="aspect-square w-full object-cover"/>:<div className="grid aspect-square place-items-center bg-stone-100 text-4xl">🛍️</div>}<div className="p-3"><p className="text-xs text-stone-500">{p.category||'Produit'}</p><h3 className="mt-1 line-clamp-2 font-bold">{p.name}</h3>{p.description&&<p className="mt-1 line-clamp-2 text-xs text-stone-500">{p.description}</p>}<p className="mt-2 font-black" style={{color:'var(--brand)'}}>{money(Number(p.price))}</p>{wa&&<a className="mt-3 block rounded-xl px-3 py-2.5 text-center text-xs font-bold text-white" style={{background:'var(--brand)'}} target="_blank" rel="noreferrer" href={'https://wa.me/'+wa+'?text='+encodeURIComponent('Bonjour, je souhaite commander : '+p.name+' ('+money(Number(p.price))+')')}>Commander sur WhatsApp</a>}</div></article>)}</div>}</section>
  <footer className="border-t bg-white px-4 py-6 text-center text-xs text-stone-500">{store.name} · Sénégal</footer>
 </main>;
}

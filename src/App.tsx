import { useState } from 'react';
import { supabase } from './lib/supabase';

type Kind = 'store' | 'catalog';

const plans = [
  { name: 'كتالوج', price: '3 000', items: ['كتالوج رقمي', 'حتى 50 منتجًا', 'رابط خاص ومشاركة سهلة'] },
  { name: 'متجر', price: '7 500', items: ['متجر إلكتروني كامل', 'حتى 300 منتج', 'سلة وطلبات عبر واتساب'], featured: true },
  { name: 'متجر احترافي', price: '15 000', items: ['مزايا المتجر المتقدمة', 'منتجات غير محدودة', 'هوية مخصصة'] },
];

const templates = [
  { name: 'أحذية وحقائب', icon: '👟', kind: 'store' as Kind, bg: '#e5e9ff' },
  { name: 'ملابس وأزياء', icon: '👗', kind: 'store' as Kind, bg: '#f8e6ef' },
  { name: 'قطع غيار السيارات', icon: '🔧', kind: 'catalog' as Kind, bg: '#fff0c4' },
  { name: 'مطاعم ووجبات', icon: '🍲', kind: 'catalog' as Kind, bg: '#dff3e8' },
  { name: 'العناية والتجميل', icon: '💄', kind: 'store' as Kind, bg: '#f4e3ff' },
];

export default function App() {
  const [lang, setLang] = useState<'ar' | 'fr'>('ar');
  const [choice, setChoice] = useState<Kind>('store');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const isArabic = lang === 'ar';

  const startCreate = (kind: Kind = 'store') => {
    setChoice(kind);
    setShowCreate(true);
    setNotice('');
  };

  const normalizePhone = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith('+')) return '+' + trimmed.slice(1).replace(/\\D/g, '');
    const digits = trimmed.replace(/\\D/g, '');
    // Senegalese local mobile numbers are commonly entered as 9 digits.
    if (digits.length === 9) return '+221' + digits;
    if (digits.startsWith('221') && digits.length === 12) return '+' + digits;
    return '+' + digits;
  };

  const makeSlug = (value: string) => {
    const base = value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'boutique';
    return base + '-' + Math.random().toString(36).slice(2, 6);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    setSubmitting(true);
    try {
      if (!otpSent) {
        const normalized = normalizePhone(phone);
        if (normalized.replace(/\\D/g, '').length < 9) {
          throw new Error(isArabic ? 'أدخل رقم هاتف صحيحًا مع رمز البلد.' : 'Saisissez un numéro valide avec son indicatif pays.');
        }
        const { error } = await supabase.auth.signInWithOtp({
          phone: normalized,
          options: { shouldCreateUser: true, data: { name: name.trim() } },
        });
        if (error) throw error;
        setVerifiedPhone(normalized);
        setOtpSent(true);
        setNotice(isArabic
          ? 'أرسلنا رمز التحقق عبر رسالة SMS. أدخل الرمز لإكمال إنشاء متجرك.'
          : 'Un code de vérification a été envoyé par SMS. Saisissez-le pour continuer.');
      } else {
        if (!/^\\d{6}$/.test(otp.trim())) {
          throw new Error(isArabic ? 'أدخل رمز التحقق المكوّن من 6 أرقام.' : 'Saisissez le code à 6 chiffres.');
        }
        const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
          phone: verifiedPhone, token: otp.trim(), type: 'sms',
        });
        if (verifyError) throw verifyError;
        if (!authData.user) throw new Error(isArabic ? 'تعذر تأكيد الحساب. حاول مجددًا.' : 'Impossible de confirmer le compte. Réessayez.');

        const slug = makeSlug(name.trim());
        const { data: storeData, error: storeError } = await supabase.from('stores').insert({
          owner_user_id: authData.user.id,
          name: name.trim(),
          slug,
          phone: verifiedPhone,
          whatsapp: verifiedPhone,
          plan: choice === 'store' ? 'store' : 'catalog',
          status: 'draft',
        }).select('id,slug,name').single();
        if (storeError) throw storeError;
        setNotice(isArabic
          ? `تم إنشاء مساحة نشاطك بنجاح! اسم الرابط: ${storeData.slug}. المتجر محفوظ كمسودة ويمكنك إكمال إعداداته لاحقًا.`
          : `Votre espace a été créé. Identifiant du lien : ${storeData.slug}. Il est enregistré en brouillon pour que vous puissiez terminer sa configuration.`);
        setOtpSent(false);
        setOtp('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setNotice((isArabic ? 'تعذر إكمال التسجيل: ' : 'Échec de l’inscription : ') + message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} className="min-h-screen pb-24" style={{ background: 'var(--bg, #f5f6fb)', color: 'var(--ink, #10142b)', fontFamily: 'Tajawal, sans-serif' }}>
      <style>{`
        :root { --bg:#f5f6fb; --card:#fff; --ink:#10142b; --mute:#626a8a; --pri:#1b2a6b; --acc:#f5b800; --line:#e2e5f1; --ok:#0f8a5f; }
        * { box-sizing:border-box; }
        html { scroll-behavior:smooth; }
        .js-wrap { max-width:900px; margin:0 auto; padding:0 16px; }
        .js-card { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:18px; }
        .js-btn { min-height:48px; display:inline-flex; align-items:center; justify-content:center; padding:12px 20px; border-radius:14px; background:var(--acc); color:#2a2000; font-weight:800; border:0; cursor:pointer; }
        .js-btn-primary { background:var(--pri); color:white; }
        .js-muted { color:var(--mute); }
        .js-grid { display:grid; gap:12px; }
        .js-scroll { display:flex; gap:12px; overflow-x:auto; padding:4px 0 12px; }
        .js-template { flex:0 0 180px; border:1px solid var(--line); border-radius:18px; overflow:hidden; background:var(--card); }
        .js-template-visual { height:120px; display:grid; place-items:center; font-size:52px; }
        .js-section { padding:32px 0; }
        .js-plan { position:relative; }
        .js-plan-featured { border:2px solid var(--pri); }
        .js-field { width:100%; border:1px solid var(--line); background:var(--bg); border-radius:12px; padding:12px; font:inherit; margin-top:5px; }
        @media(min-width:620px) { .js-two { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media(min-width:760px) { .js-hero-inner { grid-template-columns:1.2fr 1fr; } .js-plans { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media(prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } }
      `}</style>

      <header style={{ position:'sticky', top:0, zIndex:5, background:'var(--bg)', borderBottom:'1px solid var(--line)' }}>
        <div className="js-wrap flex items-center gap-3 h-14">
          <div className="grid place-items-center rounded-xl font-extrabold text-xl" style={{ width:38,height:38,background:'var(--pri)',color:'white' }}>J</div>
          <strong className="flex-1 text-lg">Jokk Shop</strong>
          <button onClick={() => setLang(isArabic ? 'fr' : 'ar')} className="rounded-full border px-3 py-2 text-sm font-bold" style={{ borderColor:'var(--line)',background:'var(--card)' }}>{isArabic ? 'Français' : 'العربية'}</button>
        </div>
      </header>

      <section style={{ background:'#1b2a6b', color:'#fff', backgroundImage:'repeating-radial-gradient(circle at 0 0,transparent 0 18px,rgba(245,184,0,.22) 18px 21px)' }}>
        <div className="js-wrap js-grid js-hero-inner items-center" style={{ paddingTop:36,paddingBottom:40,gap:28 }}>
          <div>
            <h1 className="text-3xl font-extrabold leading-tight mb-3">{isArabic ? 'أنشئ متجرك أو كتالوجك الرقمي في دقائق' : 'Créez votre boutique ou catalogue en quelques minutes'}</h1>
            <p className="text-lg mb-5" style={{ opacity:.92 }}>{isArabic ? 'رابط خاص بك، ولوحة تحكم سهلة، وطلبات تصلك على واتساب. بدون برمجة.' : 'Votre lien, un tableau de bord simple et des commandes sur WhatsApp. Sans programmation.'}</p>
            <div className="flex flex-wrap gap-3">
              <button className="js-btn" onClick={() => startCreate('store')}>{isArabic ? 'أنشئ متجرك' : 'Créer ma boutique'}</button>
              <a className="js-btn" href="#templates" style={{ background:'transparent',border:'1.5px solid rgba(255,255,255,.65)',color:'#fff' }}>{isArabic ? 'شاهد النماذج' : 'Voir les modèles'}</a>
            </div>
          </div>
          <div aria-hidden="true" className="justify-self-center" style={{ width:210,border:'6px solid #0c1022',borderRadius:30,background:'var(--bg)',color:'var(--ink)',overflow:'hidden',boxShadow:'0 18px 40px rgba(0,0,0,.35)',transform:'rotate(-3deg)' }}>
            <div className="flex items-center gap-2 px-3 font-bold text-xs" style={{ height:34,background:'var(--card)' }}><span className="rounded-md" style={{ width:18,height:18,background:'var(--pri)' }} /> Élégance</div>
            <div className="m-2 rounded-xl" style={{ height:70,background:'#1b2a6b',backgroundImage:'repeating-radial-gradient(circle at 100% 0,transparent 0 8px,rgba(245,184,0,.3) 8px 10px)' }} />
            <div className="grid grid-cols-2 gap-2 px-2 pb-3">{templates.slice(0,4).map((t) => <div key={t.name} className="grid place-items-center rounded-xl text-3xl" style={{ aspectRatio:'1',background:t.bg }}>{t.icon}</div>)}</div>
          </div>
        </div>
      </section>

      <div className="js-wrap">
        <section className="js-section">
          <h2 className="text-2xl font-extrabold mb-1">{isArabic ? 'ماذا تريد أن تنشئ؟' : 'Que souhaitez-vous créer ?'}</h2>
          <p className="js-muted mb-4">{isArabic ? 'اختر ما يناسب نشاطك.' : 'Choisissez la solution adaptée à votre activité.'}</p>
          <div className="js-grid js-two">
            {[{kind:'store' as Kind,title:isArabic?'متجر إلكتروني':'Boutique en ligne',desc:isArabic?'للبيع المباشر عبر الإنترنت.':'Pour vendre directement en ligne.',features:isArabic?['سلة وطلبات عبر واتساب','لوحة تحكم للمنتجات والطلبات','رابط خاص بك']:['Panier et commandes WhatsApp','Gestion des produits et commandes','Lien personnalisé']},{kind:'catalog' as Kind,title:isArabic?'كتالوج رقمي':'Catalogue numérique',desc:isArabic?'لعرض منتجاتك وأسعارك فقط.':'Pour présenter vos produits et prix.',features:isArabic?['عرض أنيق للمنتجات','مشاركة الرابط بسهولة','تحديث الأسعار في أي وقت']:['Présentation élégante','Partage facile du lien','Prix modifiables à tout moment']}].map((p) => <article key={p.kind} className="js-card"><h3 className="text-xl font-extrabold mb-1">{p.title}</h3><p className="js-muted mb-3">{p.desc}</p><ul className="grid gap-2 mb-4">{p.features.map(x=><li key={x} className="flex gap-2"><span style={{color:'var(--ok)'}}>✓</span>{x}</li>)}</ul><button className="js-btn js-btn-primary w-full" onClick={()=>startCreate(p.kind)}>{isArabic?'ابدأ الآن':'Commencer'}</button></article>)}
          </div>
        </section>

        <section id="templates" className="js-section">
          <h2 className="text-2xl font-extrabold mb-1">{isArabic ? 'نماذج جاهزة' : 'Modèles prêts à utiliser'}</h2>
          <p className="js-muted mb-4">{isArabic ? 'ابدأ من نموذج قريب من نشاطك.' : 'Choisissez un modèle proche de votre activité.'}</p>
          <div className="js-scroll">{templates.map(t=><article key={t.name} className="js-template"><div className="js-template-visual" style={{background:t.bg}}>{t.icon}</div><div className="p-3"><strong className="block mb-3">{t.name}</strong><button className="js-btn js-btn-primary w-full text-sm" style={{minHeight:40,padding:8}} onClick={()=>startCreate(t.kind)}>{isArabic?'اختر النموذج':'Choisir'}</button></div></article>)}</div>
        </section>

        <section className="js-section">
          <h2 className="text-2xl font-extrabold mb-1">{isArabic ? 'كيف تبدأ؟' : 'Comment commencer ?'}</h2><p className="js-muted mb-4">{isArabic ? 'ثلاث خطوات فقط.' : 'Seulement trois étapes.'}</p>
          <div className="js-grid">{(isArabic?['سجّل واختر النموذج','أضف منتجاتك وصورك وأسعارك','شارك رابطك مع عملائك']:['Inscrivez-vous et choisissez un modèle','Ajoutez vos produits, photos et prix','Partagez votre lien avec vos clients']).map((s,i)=><div className="js-card flex items-center gap-4" key={s}><span className="grid place-items-center rounded-full font-extrabold" style={{width:38,height:38,flexShrink:0,background:'var(--acc)'}}>{i+1}</span><strong>{s}</strong></div>)}</div>
        </section>

        <section className="js-section">
          <h2 className="text-2xl font-extrabold mb-1">{isArabic ? 'أسعار بسيطة' : 'Des tarifs simples'}</h2><p className="js-muted mb-5">{isArabic ? 'اشتراك شهري، بلا عمولة على مبيعاتك.' : 'Un abonnement mensuel, sans commission sur vos ventes.'}</p>
          <div className="js-grid js-plans">{plans.map(p=><article key={p.name} className={`js-card js-plan ${p.featured?'js-plan-featured':''}`}><h3 className="text-xl font-extrabold">{p.name}</h3><p className="text-3xl font-extrabold my-2">{p.price}<small className="text-sm font-medium js-muted"> {isArabic?'FCFA / شهر':'FCFA / mois'}</small></p><ul className="grid gap-2">{p.items.map(i=><li key={i}>✓ {i}</li>)}</ul><button className="js-btn js-btn-primary w-full mt-4" onClick={()=>startCreate(p.name==='كتالوج'?'catalog':'store')}>{isArabic?'اختر الخطة':'Choisir ce forfait'}</button></article>)}</div>
          <p className="js-muted text-sm text-center mt-4">{isArabic?'الأسعار المعروضة مبدئية وتحتاج إلى اعتماد قبل تفعيل الاشتراكات.':'Les tarifs affichés sont provisoires et doivent être validés avant activation.'}</p>
        </section>
      </div>

      <footer className="text-center border-t py-6 px-4 text-sm js-muted" style={{borderColor:'var(--line)'}}>Jokk Shop · {isArabic?'منصة للمتاجر والكتالوجات الرقمية في السنغال':'Plateforme de boutiques et catalogues numériques au Sénégal'}</footer>
      <div className="fixed bottom-0 inset-x-0 z-10 border-t p-3" style={{background:'var(--card)',borderColor:'var(--line)',paddingBottom:'calc(12px + env(safe-area-inset-bottom, 0px))'}}><button className="js-btn w-full mx-auto" style={{maxWidth:520,display:'flex'}} onClick={()=>startCreate('store')}>{isArabic?'أنشئ متجرك الآن':'Créer ma boutique'}</button></div>

      {showCreate && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{background:'rgba(8,10,25,.58)'}} onClick={()=>setShowCreate(false)}><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-auto" style={{background:'var(--card)',color:'var(--ink)'}} onClick={e=>e.stopPropagation()}><div className="flex items-center mb-4"><h2 className="text-xl font-extrabold flex-1">{isArabic?'إنشاء متجرك':'Créer votre espace'}</h2><button className="text-2xl px-2" onClick={()=>setShowCreate(false)} aria-label={isArabic?'إغلاق':'Fermer'}>×</button></div><p className="js-muted mb-4">{isArabic?'أدخل بيانات نشاطك، ثم أكد رقم هاتفك برمز SMS لإنشاء مساحة آمنة مرتبطة بقاعدة البيانات.':'Saisissez les informations de votre activité, puis confirmez votre téléphone par SMS pour créer votre espace sécurisé.'}</p><div className="grid grid-cols-2 gap-2 mb-3"><button className="js-card text-center" style={{borderColor:choice==='store'?'var(--pri)':'var(--line)'}} onClick={()=>setChoice('store')}>{isArabic?'متجر إلكتروني':'Boutique'}</button><button className="js-card text-center" style={{borderColor:choice==='catalog'?'var(--pri)':'var(--line)'}} onClick={()=>setChoice('catalog')}>{isArabic?'كتالوج رقمي':'Catalogue'}</button></div><form onSubmit={submit}><label className="block font-bold mt-3">{isArabic?'اسم النشاط':'Nom de l’activité'}<input required minLength={2} maxLength={120} className="js-field" value={name} onChange={e=>setName(e.target.value)} placeholder={isArabic?'مثال: أناقة':'Ex. Élégance'} disabled={otpSent} /></label><label className="block font-bold mt-3">{isArabic?'رقم واتساب':'Numéro WhatsApp'}<input required className="js-field" value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" placeholder="+221 70 000 00 00" disabled={otpSent} /></label>{otpSent && <label className="block font-bold mt-3">{isArabic?'رمز التحقق SMS':'Code de vérification SMS'}<input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="js-field" value={otp} onChange={e=>setOtp(e.target.value.replace(/\\D/g,''))} placeholder="123456" /></label>}<button className="js-btn js-btn-primary w-full mt-5" type="submit" disabled={submitting}>{submitting ? (isArabic?'جارٍ المعالجة…':'Traitement…') : otpSent ? (isArabic?'تأكيد وإنشاء النشاط':'Vérifier et créer') : (isArabic?'إرسال رمز التحقق':'Envoyer le code SMS')}</button>{otpSent && <button className="w-full mt-3 p-2 underline" type="button" onClick={()=>{setOtpSent(false);setOtp('');setNotice('');}}>{isArabic?'تغيير رقم الهاتف':'Modifier le numéro'}</button>}</form>{notice && <p role="status" className="mt-4 rounded-xl p-3 text-sm break-words" style={{background:'#fff0c4',color:'#4d3a00'}}>{notice}</p>}</div></div>}
    </main>
  );
}

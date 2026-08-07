import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, MessageCircle, CheckCircle2 } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { Category, Profile, ModerationResult } from '../types/database';
import ImageUpload from '../components/ImageUpload';
import { CATEGORY_FIELDS, type CategoryField } from '../categoryFields';
import { SENEGAL_CITIES } from '../senegalCities';
import FeatureListingPrompt from '../components/FeatureListingPrompt';

export default function PublishScreen({ onBack, onSuccess, user, userProfile }: {
  onBack: () => void;
  onSuccess: () => void;
  user: { id: string };
  userProfile: Profile | null;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [published, setPublished] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const selectedCategory = categories.find((c) => c.id === category);
  const categoryFields: CategoryField[] = selectedCategory ? CATEGORY_FIELDS[selectedCategory.slug] || [] : [];

  function setAttribute(key: string, value: string | number | boolean) {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(files: FileList) {
    for (let i = 0; i < files.length && images.length < 5; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error } = await supabase.storage.from('listings').upload(fileName, file);
      if (!error && images.length < 5) setImages((prev) => [...prev, fileName]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !price || !category) {
      setToast('Remplissez tous les champs obligatoires');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setLoading(true);
    try {
      const moderationRes = await fetch(`${supabaseUrl}/functions/v1/moderate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ action: 'check', title, description }),
      });
      const moderation: ModerationResult = await moderationRes.json();
      if (moderation.recommendation === 'review') setToast(`Attention: ${moderation.flags.join(', ')}`);

      const { data: inserted, error } = await supabase.from('listings').insert({
        title, description, price: parseInt(price), price_unit: priceUnit,
        quantity: parseInt(quantity), category_id: category, location, phone, user_id: user.id, images,
        attributes,
      }).select('id').single();
      if (error) throw error;
      setPublished({ id: inserted.id, title });
    } catch (err) {
      console.error(err);
      setToast('Erreur');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setLoading(false);
    }
  }

  if (published) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
          <h1 className="flex-1 text-white font-extrabold text-lg">Nouvelle annonce</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center text-center pt-10">
          <CheckCircle2 className="w-14 h-14 text-[#1E5C20] mb-3" />
          <p className="font-extrabold text-lg">Annonce publiée !</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Elle est maintenant visible sur SamaVolaille.</p>
          <FeatureListingPrompt listingId={published.id} listingTitle={published.title} />
          <button onClick={onSuccess} className="w-full mt-8 bg-[#1E5C20] text-white rounded-lg py-3.5 font-extrabold text-base">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" />Retour</button>
        <h1 className="flex-1 text-white font-extrabold text-lg">Nouvelle annonce</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <ImageUpload images={images} onUpload={handleImageUpload} onRemove={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))} />
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Titre *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Poussins Cobb 500" className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Catégorie *</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setAttributes({}); }} className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors appearance-none bg-white">
              <option value="">Choisir...</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
            </select>
          </div>
          {categoryFields.length > 0 && (
            <div className="space-y-4 bg-[#EEF6EE] rounded-lg p-3.5 border border-[#1E5C20]/10">
              <p className="text-xs font-bold text-[#1E5C20] uppercase tracking-wide">Détails {selectedCategory?.name}</p>
              {categoryFields.map((field) => (
                <div key={field.key}>
                  {field.type === 'boolean' ? (
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!attributes[field.key]}
                        onChange={(e) => setAttribute(field.key, e.target.checked)}
                        className="w-4 h-4 accent-[#1E5C20]"
                      />
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={(attributes[field.key] as string) || ''}
                          onChange={(e) => setAttribute(field.key, e.target.value)}
                          className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors appearance-none bg-white"
                        >
                          <option value="">Choisir...</option>
                          {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={(attributes[field.key] as string) || ''}
                          onChange={(e) => setAttribute(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors"
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Prix (FCFA) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 350" className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Par unité</label>
              <input type="text" value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} placeholder="Ex: poussin" className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Quantité</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex: 100" className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Localisation</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors appearance-none bg-white">
                <option value="">Choisir une ville...</option>
                {SENEGAL_CITIES.map(({ region, cities }) => (
                  <optgroup key={region} label={region}>
                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Téléphone (WhatsApp) *</label>
            <div className="relative">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Ex: 771234567" className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600">
                <MessageCircle className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre produit..." rows={4} className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#1E5C20] text-white rounded-lg py-3.5 font-extrabold text-base disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </form>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white px-5 py-3 rounded-xl text-sm font-semibold z-[100] whitespace-nowrap shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { Category, Profile, ModerationResult } from '../types/database';
import ImageUpload from '../components/ImageUpload';

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
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

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

      const { error } = await supabase.from('listings').insert({
        title, description, price: parseInt(price), price_unit: priceUnit,
        quantity: parseInt(quantity), category_id: category, location, phone, user_id: user.id, images,
      });
      if (error) throw error;
      setToast('Annonce publiée !');
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      console.error(err);
      setToast('Erreur');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setLoading(false);
    }
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
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors appearance-none bg-white">
              <option value="">Choisir...</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
            </select>
          </div>
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
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Dakar" className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors" />
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

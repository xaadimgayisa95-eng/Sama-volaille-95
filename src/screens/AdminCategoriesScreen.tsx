import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getImageUrl, handleImgError } from '../utils';
import type { Category } from '../types/database';

export default function AdminCategoriesScreen({ onBack, showToast }: {
  onBack: () => void;
  showToast: (msg: string) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
    setLoading(false);
  }

  async function handleUpload(categoryId: string, file: File) {
    setUploadingId(categoryId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `categories/${categoryId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('listings').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const imageUrl = getImageUrl(fileName);
      const { error: updateError } = await supabase.from('categories').update({ image_url: imageUrl }).eq('id', categoryId);
      if (updateError) throw updateError;
      setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, image_url: imageUrl } : c)));
      showToast('Photo mise à jour');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du téléversement');
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="flex-1 text-white font-extrabold text-lg">Photos des catégories</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 py-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-[#EEF6EE] shrink-0">
                  {uploadingId === cat.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#1E5C20]" />
                  ) : cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} onError={handleImgError} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{cat.icon}</span>
                  )}
                </div>
                <span className="flex-1 font-semibold text-sm">{cat.name}</span>
                <input
                  ref={(el) => { fileInputs.current[cat.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(cat.id, f); e.target.value = ''; }}
                />
                <button
                  onClick={() => fileInputs.current[cat.id]?.click()}
                  disabled={uploadingId === cat.id}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#1E5C20] bg-[#EEF6EE] px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />Changer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

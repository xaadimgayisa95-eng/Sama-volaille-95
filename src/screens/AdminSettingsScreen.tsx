import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FIELDS = [
  { key: 'featured_price', label: 'Prix de mise en avant (F CFA)' },
  { key: 'wave_link', label: 'Lien de paiement Wave' },
  { key: 'orange_money_number', label: 'Numéro Orange Money' },
  { key: 'whatsapp_number', label: 'Numéro WhatsApp de confirmation' },
];

export default function AdminSettingsScreen({ onBack, showToast }: {
  onBack: () => void;
  showToast: (msg: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('app_settings').select('key,value').then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setValues(map);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const rows = FIELDS.map((f) => ({ key: f.key, value: values[f.key] || '' }));
    const { error } = await supabase.from('app_settings').upsert(rows);
    setSaving(false);
    showToast(error ? 'Erreur' : 'Paramètres enregistrés');
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="flex-1 text-white font-extrabold text-lg">Paiement & mise en avant</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">{f.label}</label>
                <input
                  type="text"
                  value={values[f.key] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-lg px-3.5 py-3 text-sm focus:border-[#1E5C20] outline-none transition-colors"
                />
              </div>
            ))}
            <button onClick={handleSave} disabled={saving} className="w-full bg-[#1E5C20] text-white rounded-lg py-3.5 font-extrabold text-base disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

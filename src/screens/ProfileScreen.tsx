import { Edit, Shield, ChevronRight, FileText, Heart, HelpCircle, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export default function ProfileScreen({
  user, profile, onLogout, isAdmin, onAdmin, onFavorites, showToast, onProfileUpdate,
}: {
  onBack?: () => void;
  user: { id: string; email: string };
  profile: Profile | null;
  onLogout: () => void;
  isAdmin: boolean;
  onAdmin: () => void;
  onFavorites: () => void;
  showToast: (msg: string) => void;
  onProfileUpdate: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ name: editName, phone: editPhone }).eq('id', user.id);
    if (error) showToast('Erreur lors de la sauvegarde');
    else { showToast('Profil mis à jour !'); setEditMode(false); onProfileUpdate(); }
    setSaving(false);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-gradient-to-br from-[#133D15] to-[#1E5C20] px-4 pt-4 pb-5 text-center relative">
        <button
          onClick={() => { setEditMode(!editMode); setEditName(profile?.name || ''); setEditPhone(profile?.phone || ''); }}
          className="absolute top-3 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
        >
          <Edit className="w-4 h-4 text-white" />
        </button>
        <div className="w-16 h-16 rounded-full bg-[#F5C518] flex items-center justify-center text-3xl mx-auto mb-2 border-4 border-white/30">
          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <h2 className="font-extrabold text-lg text-white">{profile?.name || 'Utilisateur'}</h2>
        <p className="text-sm text-white/60">{user.email}</p>
        {profile?.phone && <p className="text-sm text-[#F5C518] font-semibold mt-1">📞 {profile.phone}</p>}
        {!profile?.phone && (
          <button onClick={() => setEditMode(true)} className="mt-2 text-xs text-white/60 underline">+ Ajouter un numéro de téléphone</button>
        )}
        {profile?.verified && (
          <span className="inline-flex items-center gap-1 bg-[#F5C518]/20 border border-[#F5C518] text-[#F5C518] text-xs font-bold px-3 py-1 rounded-full mt-2">
            <Shield className="w-3 h-3" />Vérifié
          </span>
        )}
      </div>

      {editMode && (
        <div className="bg-white border-b border-gray-200 p-4 space-y-3 shrink-0">
          <h3 className="font-bold text-sm text-gray-700">Modifier le profil</h3>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase">Nom</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#1E5C20] outline-none mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase">Téléphone (WhatsApp)</label>
            <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Ex: 771234567" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#1E5C20] outline-none mt-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditMode(false)} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-semibold text-sm">Annuler</button>
            <button onClick={saveProfile} disabled={saving} className="flex-1 py-2.5 bg-[#1E5C20] text-white rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}Enregistrer
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 bg-white border-b border-gray-200 shrink-0">
        <div className="p-3 text-center border-r border-gray-200">
          <span className="font-extrabold text-xl text-[#1E5C20]">{profile?.listings_count || 0}</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Annonces</p>
        </div>
        <div className="p-3 text-center border-r border-gray-200">
          <span className="font-extrabold text-xl text-[#1E5C20]">0</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Favoris</p>
        </div>
        <div className="p-3 text-center">
          <span className="font-extrabold text-xl text-[#1E5C20]">0</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Vues</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isAdmin && (
          <button onClick={onAdmin} className="w-full bg-gradient-to-r from-[#C1440E] to-[#e05a22] rounded-xl p-4 flex items-center gap-3 mb-4">
            <Shield className="w-7 h-7 text-white" />
            <div className="flex-1 text-left">
              <p className="font-extrabold text-white">Admin Dashboard</p>
              <p className="text-xs text-white/80">Gérer le contenu et les utilisateurs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><FileText className="w-5 h-5 text-gray-600" /></div>
            <span className="flex-1 font-semibold">Mes annonces</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={onFavorites} className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><Heart className="w-5 h-5 text-gray-600" /></div>
            <span className="flex-1 font-semibold">Mes favoris</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-gray-600" /></div>
            <span className="flex-1 font-semibold">Aide</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center"><LogOut className="w-5 h-5 text-red-500" /></div>
            <span className="flex-1 font-semibold text-red-500">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}

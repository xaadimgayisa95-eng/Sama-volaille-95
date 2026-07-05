import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export default function AdminUsersScreen({ onBack, showToast }: { onBack: () => void; showToast: (msg: string) => void }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleRole(user: Profile) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (error) showToast('Erreur lors de la mise à jour');
    else { showToast(`${user.username} est maintenant ${newRole === 'admin' ? 'admin' : 'utilisateur'}`); loadUsers(); }
  }

  async function toggleBan(user: Profile) {
    const { error } = await supabase.from('profiles').update({ is_banned: !user.is_banned }).eq('id', user.id);
    if (error) showToast('Erreur lors de la mise à jour');
    else { showToast(user.is_banned ? `${user.username} débloqué` : `${user.username} bloqué`); loadUsers(); }
  }

  async function deleteUser(user: Profile) {
    await supabase.from('listings').delete().eq('user_id', user.id);
    await supabase.from('favorites').delete().eq('user_id', user.id);
    await supabase.from('reports').delete().eq('reporter_id', user.id);
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) showToast('Erreur lors de la suppression');
    else { showToast(`Compte de ${user.username} supprimé`); setConfirmDelete(null); loadUsers(); }
  }

  const filtered = users.filter((u) => !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search));

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8]">
      <div className="gradient-green p-4 pt-14 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Utilisateurs</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-sm" />
        </div>
      </div>

      <div className="px-4 py-3 flex gap-2 shrink-0">
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#1E5C20]">{users.length}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#F5C518]">{users.filter((u) => u.role === 'admin').length}</p>
          <p className="text-[10px] text-gray-500">Admins</p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-500">{users.filter((u) => u.is_banned).length}</p>
          <p className="text-[10px] text-gray-500">Bloqués</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#1E5C20] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EEF6EE] flex items-center justify-center text-[#1E5C20] font-bold text-sm shrink-0">
                    {u.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{u.username || 'Sans nom'}</p>
                      {u.role === 'admin' && <span className="text-[8px] bg-[#F5C518] text-black px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                      {u.is_banned && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">BLOQUÉ</span>}
                    </div>
                    <p className="text-xs text-gray-500">{u.phone || 'Pas de téléphone'}</p>
                    <p className="text-[10px] text-gray-400">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                  <button onClick={() => toggleRole(u)} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#EEF6EE] text-[#1E5C20] active:scale-95 transition-transform">
                    {u.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
                  </button>
                  <button onClick={() => toggleBan(u)} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-orange-50 text-orange-600 active:scale-95 transition-transform">
                    {u.is_banned ? 'Débloquer' : 'Bloquer'}
                  </button>
                  <button onClick={() => setConfirmDelete(u)} className="px-3 text-[10px] font-bold py-1.5 rounded-lg bg-red-50 text-red-600 active:scale-95 transition-transform">
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[430px] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-2">Supprimer cet utilisateur ?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cette action supprimera le compte de <span className="font-semibold">{confirmDelete.username}</span> ainsi que toutes ses annonces. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold">Annuler</button>
              <button onClick={() => deleteUser(confirmDelete)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition-transform">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

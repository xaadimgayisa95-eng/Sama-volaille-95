import { FileText, Flag, Users, Settings, ChevronRight } from 'lucide-react';
import type { Screen } from '../types/database';

export default function AdminDashboard({
  onNavigate,
  stats,
}: {
  onNavigate: (screen: Screen) => void;
  stats: { listings: number; users: number; reports: number };
}) {
  const menuItems = [
    { icon: FileText, label: 'Gérer les annonces', screen: 'admin-listings' as Screen, count: stats.listings },
    { icon: Flag, label: 'Signalements', screen: 'admin-reports' as Screen, count: stats.reports },
    { icon: Users, label: 'Utilisateurs', screen: 'admin-users' as Screen, count: stats.users },
    { icon: Settings, label: 'Paiement & mise en avant', screen: 'admin-settings' as Screen, count: 0 },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-gradient-to-br from-[#133D15] to-[#1E5C20] px-4 py-5 shrink-0">
        <h1 className="text-white font-extrabold text-xl">Dashboard Admin</h1>
        <p className="text-white/70 text-sm">Modération et gestion</p>
      </div>
      <div className="flex-1 p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <span className="font-extrabold text-2xl text-[#1E5C20]">{stats.listings}</span>
            <p className="text-xs text-gray-500 mt-1">Annonces</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <span className="font-extrabold text-2xl text-[#1E5C20]">{stats.users}</span>
            <p className="text-xs text-gray-500 mt-1">Utilisateurs</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <span className="font-extrabold text-2xl text-orange-500">{stats.reports}</span>
            <p className="text-xs text-gray-500 mt-1">Signalements</p>
          </div>
        </div>
        <div className="space-y-2">
          {menuItems.map(({ icon: Icon, label, screen, count }) => (
            <button key={screen} onClick={() => onNavigate(screen)} className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-[#EEF6EE] rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#1E5C20]" />
              </div>
              <span className="flex-1 font-semibold text-left">{label}</span>
              {count > 0 && <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{count}</span>}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

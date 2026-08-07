import { Home, Search, PlusCircle, Heart, User } from 'lucide-react';
import type { Screen } from '../types/database';

export default function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void; onMenuOpen?: () => void }) {
  const active = screen;
  const items = [
    { id: 'home' as Screen, icon: Home, label: 'Accueil' },
    { id: 'search' as Screen, icon: Search, label: 'Rechercher' },
    { id: 'publish' as Screen, icon: PlusCircle, label: 'Publier' },
    { id: 'favorites' as Screen, icon: Heart, label: 'Favoris' },
    { id: 'profile' as Screen, icon: User, label: 'Profil' },
  ];

  return (
    <nav className="bg-white border-t border-gray-200 flex shrink-0 pb-[env(safe-area-inset-bottom)]">
      {items.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400 transition-colors"
        >
          <Icon className={`w-5 h-5 ${active === id ? 'text-[#1E5C20]' : ''}`} />
          <span className={`text-[9px] font-semibold ${active === id ? 'text-[#1E5C20]' : ''}`}>
            {label}
          </span>
          {active === id && <div className="w-1 h-1 bg-[#1E5C20] rounded-full" />}
        </button>
      ))}
    </nav>
  );
}

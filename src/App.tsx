import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Menu, XCircle, Flag, Users, FileText, LayoutDashboard, LogOut, Heart, PlusCircle, ArrowLeft } from 'lucide-react';
import type { Category, Listing, Profile, Screen } from './types/database';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import DetailScreen from './screens/DetailScreen';
import PublishScreen from './screens/PublishScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';
import AdminDashboard from './screens/AdminDashboard';
import AdminListingsScreen from './screens/AdminListingsScreen';
import AdminReportsScreen from './screens/AdminReportsScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';
import AdminSettingsScreen from './screens/AdminSettingsScreen';
import AdminCategoriesScreen from './screens/AdminCategoriesScreen';

// Screens that require a logged-in user; everything else is open to guests.
const AUTH_REQUIRED_SCREENS: Screen[] = ['publish', 'favorites', 'profile', 'admin', 'admin-listings', 'admin-reports', 'admin-users', 'admin-settings', 'admin-categories'];

function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [screen, setScreen] = useState<Screen>('home');
  const [prevScreen, setPrevScreen] = useState<Screen>('home');
  const [pendingScreen, setPendingScreen] = useState<Screen | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminStats, setAdminStats] = useState({ listings: 0, users: 0, reports: 0 });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data as Profile | null);
    return data as Profile | null;
  }, []);

  const loadAdminStats = useCallback(async () => {
    const [{ count: listings }, { count: users }, { count: reports }] = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setAdminStats({ listings: listings || 0, users: users || 0, reports: reports || 0 });
  }, []);

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) setCheckingAuth(false);
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        try { await loadProfile(session.user.id); } catch {}
      } else { setProfile(null); }
      setCheckingAuth(false);
      clearTimeout(timeout);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        setCheckingAuth(false);
        clearTimeout(timeout);
      }
    }).catch(() => {
      if (mounted) {
        setCheckingAuth(false);
        clearTimeout(timeout);
      }
    });

    return () => { mounted = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, [loadProfile]);

  function goTo(s: Screen) {
    if (AUTH_REQUIRED_SCREENS.includes(s) && !user) {
      setPendingScreen(s);
      setPrevScreen(screen);
      setScreen('auth');
      setMenuOpen(false);
      return;
    }
    setPrevScreen(screen);
    setScreen(s);
    setMenuOpen(false);
    if (s === 'admin') loadAdminStats();
  }

  function goBack() {
    setScreen(prevScreen);
  }

  function openListing(id: string) {
    setSelectedListingId(id);
    setPrevScreen(screen);
    setScreen('detail');
  }

  function openCategory(cat: Category) {
    setSelectedCategory(cat);
    setPrevScreen(screen);
    setScreen('search');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
  }

  if (checkingAuth) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#1E5C20]">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (screen === 'auth') {
    return (
      <div className="relative h-[100dvh]">
        <button
          onClick={() => { setPendingScreen(null); setScreen(prevScreen); }}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/20 flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <AuthScreen
          onSuccess={() => {
            const dest = pendingScreen || 'home';
            setPendingScreen(null);
            setScreen(dest);
            if (dest === 'admin') loadAdminStats();
          }}
        />
      </div>
    );
  }

  function renderScreen() {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onSearch={() => goTo('search')}
            onCategory={openCategory}
            onListing={openListing}
            user={user}
          />
        );
      case 'search':
        return (
          <SearchScreen
            onBack={goBack}
            onListing={openListing}
            initialCategory={selectedCategory}
          />
        );
      case 'detail':
        return selectedListingId ? (
          <DetailScreen
            id={selectedListingId}
            user={user}
            onBack={goBack}
            showToast={showToast}
          />
        ) : null;
      case 'publish':
        return (
          <PublishScreen
            user={user}
            userProfile={profile}
            onBack={goBack}
            onSuccess={() => goTo('home')}
          />
        );
      case 'favorites':
        return (
          <FavoritesScreen
            user={user}
            onBack={goBack}
            onListing={openListing}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            profile={profile}
            onLogout={handleLogout}
            isAdmin={profile?.role === 'admin'}
            onAdmin={() => goTo('admin')}
            onFavorites={() => goTo('favorites')}
            showToast={showToast}
            onProfileUpdate={() => loadProfile(user.id)}
          />
        );
      case 'admin':
        return <AdminDashboard onNavigate={goTo} stats={adminStats} />;
      case 'admin-listings':
        return <AdminListingsScreen onBack={() => goTo('admin')} showToast={showToast} />;
      case 'admin-reports':
        return <AdminReportsScreen onBack={() => goTo('admin')} showToast={showToast} />;
      case 'admin-users':
        return <AdminUsersScreen onBack={() => goTo('admin')} showToast={showToast} />;
      case 'admin-settings':
        return <AdminSettingsScreen onBack={() => goTo('admin')} showToast={showToast} />;
      case 'admin-categories':
        return <AdminCategoriesScreen onBack={() => goTo('admin')} showToast={showToast} />;
      default:
        return (
          <HomeScreen
            onSearch={() => goTo('search')}
            onCategory={openCategory}
            onListing={openListing}
            user={user}
          />
        );
    }
  }

  const isAdminScreen = screen.startsWith('admin');
  const showNav = !isAdminScreen && screen !== 'detail' && screen !== 'publish';

  return (
    <div className="h-[100dvh] flex flex-col bg-[#FAFAF8] max-w-[430px] mx-auto relative overflow-hidden">

      {menuOpen && (
        <div className="absolute inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl">
            <div className="bg-gradient-to-br from-[#133D15] to-[#1E5C20] p-5 pt-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-extrabold text-lg">Menu</h2>
                <button onClick={() => setMenuOpen(false)} className="text-white/70"><XCircle className="w-6 h-6" /></button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{profile?.name || 'Utilisateur'}</p>
                  <p className="text-white/60 text-xs">{profile?.phone || user?.email}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 py-2">
              {[
                { icon: PlusCircle, label: 'Publier une annonce', s: 'publish' as Screen },
                { icon: Heart, label: 'Mes favoris', s: 'favorites' as Screen },
                ...(profile?.role === 'admin' ? [
                  { icon: LayoutDashboard, label: 'Dashboard Admin', s: 'admin' as Screen },
                  { icon: FileText, label: 'Gérer annonces', s: 'admin-listings' as Screen },
                  { icon: Flag, label: 'Signalements', s: 'admin-reports' as Screen },
                  { icon: Users, label: 'Utilisateurs', s: 'admin-users' as Screen },
                ] : []),
              ].map(({ icon: Icon, label, s }) => (
                <button key={s} onClick={() => goTo(s)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-left">
                  <Icon className="w-5 h-5 text-[#1E5C20]" />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-gray-100 p-4">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-1 py-2 text-red-600">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-semibold">Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-col flex-1 min-h-0 overflow-hidden ${showNav ? 'pb-16' : ''}`}>
        {renderScreen()}
      </div>

      {showNav && (
        <div className="absolute bottom-0 left-0 right-0">
          <BottomNav screen={screen} onNavigate={goTo} onMenuOpen={() => setMenuOpen(true)} />
        </div>
      )}

      {isAdminScreen && (
        <button onClick={() => setMenuOpen(true)} className="absolute top-3 right-4 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-white/20">
          <Menu className="w-5 h-5 text-white" />
        </button>
      )}

      <Toast message={toast} />
    </div>
  );
}

export default App;

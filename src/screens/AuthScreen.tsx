import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleLogin() {
    setGoogleLoading(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Erreur Google');
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        if (data.user) await supabase.from('profiles').insert({ id: data.user.id, name, phone });
      }
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-[#133D15] via-[#1E5C20] to-[#2D7A30] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 my-4">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-[#F5C518] rounded-xl flex items-center justify-center text-3xl mx-auto mb-3">🐓</div>
          <h1 className="font-extrabold text-2xl">Sama<span className="text-[#F5C518]">Volaille</span></h1>
          <p className="text-gray-500 text-xs mt-1">Marché avicole en ligne</p>
        </div>

        <button onClick={handleGoogleLogin} disabled={googleLoading} className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-lg py-3 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4">
          {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googleLoading ? 'Connexion...' : 'Continuer avec Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 font-medium">ou</span><div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Connexion</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Inscription</button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-xs rounded-lg p-2.5 mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" className="w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:border-[#1E5C20] outline-none" required />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (WhatsApp)" className="w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:border-[#1E5C20] outline-none" />
            </>
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:border-[#1E5C20] outline-none" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:border-[#1E5C20] outline-none" required />
          <button type="submit" disabled={loading} className="w-full bg-[#1E5C20] text-white rounded-lg py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>
      </div>
    </div>
  );
}

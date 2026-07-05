import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: '#EEF6EE', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐓</div>
          <h1 style={{ color: '#1E5C20', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>SamaVolaille</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Une erreur inattendue s'est produite.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#1E5C20', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
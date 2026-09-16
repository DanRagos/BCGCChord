import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <header
        className="border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-bold text-lg">
            🎵 Chordbook
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/import" className="hover:underline">
              Import
            </Link>
            <Link to="/lineups" className="hover:underline">
              Lineups
            </Link>
            <button
              onClick={toggleTheme}
              className="px-2 py-1 rounded border"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            {user ? (
              <>
                <span className="opacity-70">{user.name}</span>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="underline"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

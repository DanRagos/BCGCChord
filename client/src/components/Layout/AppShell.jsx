import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Fixed h-14 (3.5rem) on purpose: LineupLivePage positions itself as a
          viewport-fixed panel starting at `top-14`, so it always sits exactly
          below this header regardless of AppShell's own padding. If this
          header's height ever changes, update that offset too. */}
      <header
        className="h-14 border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="h-full max-w-5xl mx-auto flex items-center justify-between gap-2 px-3 sm:px-4">
          <Link to="/" className="font-bold text-base sm:text-lg shrink-0 whitespace-nowrap">
            🎵 Chordbook
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm overflow-x-auto">
            <Link to="/import" className="hover:underline whitespace-nowrap">
              Import
            </Link>
            <Link to="/lineups" className="hover:underline whitespace-nowrap">
              Lineups
            </Link>
            <button
              onClick={toggleTheme}
              className="px-2 py-1 rounded border shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
              aria-label="Toggle theme"
            >
              <span className="sm:hidden">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="hidden sm:inline">{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
            </button>
            {user ? (
              <>
                <span className="opacity-70 hidden sm:inline whitespace-nowrap">{user.name}</span>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="underline whitespace-nowrap shrink-0"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="underline whitespace-nowrap shrink-0">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}

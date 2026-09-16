import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/Layout/AppShell.jsx';

// Route-level code splitting: chordsheetjs (client-side transpose-for-display,
// used by the Lineup live view) and the chord editor's drag/drop + popover UI
// are both sizeable and only needed on specific pages — lazy-loading each
// page keeps the main bundle from carrying weight most visits never touch.
const LibraryPage = lazy(() => import('./pages/LibraryPage.jsx'));
const SongViewerPage = lazy(() => import('./pages/SongViewerPage.jsx'));
const SongEditorPage = lazy(() => import('./pages/SongEditorPage.jsx'));
const ImportPreviewPage = lazy(() => import('./pages/ImportPreviewPage.jsx'));
const LineupListPage = lazy(() => import('./pages/LineupListPage.jsx'));
const LineupEditorPage = lazy(() => import('./pages/LineupEditorPage.jsx'));
const LineupLivePage = lazy(() => import('./pages/LineupLivePage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<p className="opacity-70 max-w-5xl mx-auto px-4 py-6">Loading…</p>}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/songs/:id" element={<SongViewerPage />} />
          <Route path="/songs/:id/edit" element={<SongEditorPage />} />
          <Route path="/import" element={<ImportPreviewPage />} />
          <Route path="/lineups" element={<LineupListPage />} />
          <Route path="/lineups/:id/edit" element={<LineupEditorPage />} />
          <Route path="/lineups/:id/live" element={<LineupLivePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

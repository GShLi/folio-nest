import { Route, Routes } from 'react-router';
import type { Portfolio } from './content/schema';
import { ContentProvider, useContentState } from './content/ContentProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SiteLayout } from './components/SiteLayout';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectPage } from './pages/ProjectPage';
import { NotFoundPage } from './pages/NotFoundPage';

function ContentGate() {
  const { content, error, loading, reload } = useContentState();
  if (!content)
    return (
      <main id="main-content" tabIndex={-1} className="shell empty-state" aria-busy={loading}>
        <p className="eyebrow">PORTFOLIO</p>
        <h1>{error ? '作品暂时无法加载' : '正在整理作品…'}</h1>
        <p role="status">{error ?? '请稍候，马上呈现。'}</p>
        {error && (
          <button className="button primary" onClick={reload} disabled={loading}>
            {loading ? '正在重试…' : '重新加载'}
          </button>
        )}
      </main>
    );
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  );
}

export default function App({ initialContent }: { initialContent?: Portfolio }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ContentProvider initialContent={initialContent}>
          <ContentGate />
        </ContentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

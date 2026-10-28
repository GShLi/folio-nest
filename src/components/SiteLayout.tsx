import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ArrowUpRight, Moon, Sun } from '@phosphor-icons/react';
import { useContentState, usePortfolio } from '../content/ContentProvider';
import { useTheme } from '../theme/ThemeProvider';
import { Seo } from './Seo';

export function SiteLayout({ children }: { children: ReactNode }) {
  const { site, projects } = usePortfolio();
  const { error, loading, reload } = useContentState();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);
  const themeLabel = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
  return (
    <>
      <Seo />
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        跳转到内容
      </a>
      <header className="site-header shell">
        <Link className="wordmark" to="/" aria-label={`${site.name} 首页`}>
          <span className="brand-symbol" aria-hidden="true">
            {site.monogram}
          </span>
          <span>
            {site.name}
            <span className="wordmark-tail">/</span>
          </span>
        </Link>
        <nav aria-label="主导航">
          <NavLink to="/" end>
            首页
          </NavLink>
          <NavLink to="/projects">
            作品<span className="nav-count">{String(projects.length).padStart(2, '0')}</span>
          </NavLink>
        </nav>
        <div className="header-actions">
          <span className="header-caption">{site.tagline}</span>
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            <span>{theme === 'dark' ? '浅色' : '深色'}</span>
          </button>
        </div>
      </header>
      {error && (
        <div className="content-notice shell" role="status">
          <span>内容更新暂时失败，正在显示最近发布的版本。</span>
          <button onClick={reload} disabled={loading}>
            重试
          </button>
        </div>
      )}
      {children}
      <footer className="site-footer shell">
        <span>{site.footer}</span>
        {site.isDemo && <p>示例作品集 · 项目及配图均为示例</p>}
        <Link to="/projects">
          全部作品 <ArrowUpRight size={15} />
        </Link>
      </footer>
    </>
  );
}

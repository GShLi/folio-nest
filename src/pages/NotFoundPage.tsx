import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main id="main-content" tabIndex={-1} className="shell empty-state">
      <p className="eyebrow">404 / NOT FOUND</p>
      <h1>这个页面还没有收录</h1>
      <p>链接可能已更新，去看看其他作品吧。</p>
      <Link className="button primary" to="/projects">
        返回作品列表
      </Link>
    </main>
  );
}

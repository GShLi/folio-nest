import { useSearchParams } from 'react-router';
import { ArrowRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import { usePortfolio } from '../content/ContentProvider';
import { filterProjects } from '../content/schema';
import { ProjectCard } from '../components/ProjectCard';

export function ProjectsPage() {
  const { projects, categories } = usePortfolio();
  const [params, setParams] = useSearchParams();
  const selected = params.get('category') ?? '';
  const category = categories.some((item) => item.id === selected) ? selected : '';
  const query = params.get('q') ?? '';
  const matches = filterProjects(projects, category, query);
  function update(key: string, value: string, replace = false) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace },
    );
  }
  return (
    <main id="main-content" tabIndex={-1} className="shell work-page page-enter">
      <div className="work-title">
        <p className="eyebrow">SELECTED WORK</p>
        <h1>用作品，表达想法。</h1>
        <p>小程序、Web 应用，以及从想法走到实现的过程。</p>
      </div>
      <div className="work-controls">
        <div className="filter-tabs" role="group" aria-label="按作品类型筛选">
          {[{ id: '', label: '全部' }, ...categories].map((item) => (
            <button
              key={item.id}
              className={category === item.id ? 'active' : ''}
              aria-pressed={category === item.id}
              onClick={() => update('category', item.id)}
            >
              {item.label}
              <span>
                {item.id
                  ? projects.filter((project) => project.category === item.id).length
                  : projects.length}
              </span>
            </button>
          ))}
        </div>
        <label className="search-box">
          <MagnifyingGlass size={19} />
          <span className="sr-only">搜索作品</span>
          <input
            type="search"
            value={query}
            maxLength={200}
            onChange={(event) => update('q', event.target.value, true)}
            placeholder="搜索项目、技术栈"
          />
          {query && (
            <button onClick={() => update('q', '', true)} aria-label="清除搜索">
              <X size={16} />
            </button>
          )}
        </label>
      </div>
      <p className="results-count" aria-live="polite">
        {matches.length} 个作品{query && `，搜索「${query}」`}
      </p>
      {matches.length ? (
        <div className="work-grid">
          {matches.map((project, index) => (
            <ProjectCard key={project.slug} project={project} priority={index < 2} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MagnifyingGlass size={40} weight="light" />
          <h2>{projects.length ? '还没有找到这个作品' : '作品正在准备中'}</h2>
          <p>
            {projects.length
              ? '试试其他关键词，或者查看全部项目。'
              : '新的项目发布后，会出现在这里。'}
          </p>
          {projects.length > 0 && (
            <button className="button primary" onClick={() => setParams({})}>
              重置筛选 <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}
    </main>
  );
}

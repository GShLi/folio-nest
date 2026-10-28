import { Fragment } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { usePortfolio } from '../content/ContentProvider';
import { categoryLabel } from '../content/schema';
import { ProjectImage } from '../components/ProjectImage';
import { ProjectCard } from '../components/ProjectCard';

export function HomePage() {
  const content = usePortfolio();
  const { site, projects } = content;
  const featured = projects.find((project) => project.featured) ?? projects[0];
  const remaining = projects.filter((project) => project !== featured).slice(0, 4);
  return (
    <main id="main-content" tabIndex={-1} className="shell page-enter">
      <section className="editorial-hero">
        <div className="hero-copy">
          <p className="eyebrow">{site.hero.eyebrow}</p>
          <h1>
            {site.hero.heading.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
            <span className="accent">。</span>
          </h1>
          <p className="hero-description">
            {site.hero.description.split('\n').map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
          <Link to="/projects" className="button primary">
            探索作品 <ArrowUpRight size={20} />
          </Link>
        </div>
        {featured ? (
          <Link
            className="editorial-feature"
            to={`/projects/${featured.slug}`}
            aria-label={`查看 ${featured.name} 项目详情`}
          >
            <ProjectImage image={featured.cover} color={featured.color} priority />
            <div className="feature-caption">
              <span>
                <small>精选项目 / {categoryLabel(content, featured.category)}</small>
                <strong>
                  {featured.name} <span>{featured.subtitle}</span>
                </strong>
              </span>
              <ArrowUpRight size={30} />
            </div>
          </Link>
        ) : (
          <div className="empty-feature">
            <p className="eyebrow">WORK IN PROGRESS</p>
            <h2>新的作品，正在路上。</h2>
            <p>认真打磨，慢慢更新。</p>
          </div>
        )}
      </section>
      {remaining.length > 0 && (
        <section className="selected-section">
          <div className="section-heading">
            <h2>
              还有一些，<span>认真做的东西。</span>
            </h2>
            <Link className="text-link" to="/projects">
              全部作品 <ArrowRight size={20} />
            </Link>
          </div>
          <div className="editorial-grid">
            {remaining.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

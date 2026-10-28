import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, ArrowUpRight, CornersOut, Plus } from '@phosphor-icons/react';
import { usePortfolio } from '../content/ContentProvider';
import { categoryLabel } from '../content/schema';
import type { ImageAsset, Project } from '../content/schema';
import { ProjectImage } from '../components/ProjectImage';
import { ImageDialog } from '../components/ImageDialog';
import { NotFoundPage } from './NotFoundPage';

export function ProjectPage() {
  const { slug } = useParams();
  const { projects } = usePortfolio();
  const project = projects.find((item) => item.slug === slug);
  return project ? <ProjectDetail key={project.slug} project={project} /> : <NotFoundPage />;
}

function ProjectDetail({ project }: { project: Project }) {
  const content = usePortfolio();
  const { projects } = content;
  const [image, setImage] = useState<ImageAsset | null>(null);
  const next =
    projects.length > 1 ? projects[(projects.indexOf(project) + 1) % projects.length] : null;
  return (
    <main id="main-content" tabIndex={-1} className="shell detail-page page-enter">
      <Link className="back-link" to="/projects">
        <ArrowLeft size={18} /> 返回作品列表
      </Link>
      <header className="detail-heading">
        <div>
          <p className="detail-category">
            {categoryLabel(content, project.category)}
            <span>{project.year}</span>
            {project.isDemo && <span>示例项目</span>}
          </p>
          <h1>
            {project.name}
            <span>{project.subtitle}</span>
          </h1>
        </div>
        <p className="detail-summary">{project.summary}</p>
      </header>
      <div className="detail-cover">
        <ProjectImage image={project.cover} color={project.color} priority />
        <button
          className="zoom-button"
          aria-label="查看项目大图"
          onClick={() => setImage(project.cover)}
        >
          <CornersOut size={20} />
          <span>查看项目大图</span>
        </button>
      </div>
      <div className="case-layout">
        <aside className="project-facts">
          <dl>
            <div>
              <dt>负责方向</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>项目周期</dt>
              <dd>{project.duration}</dd>
            </div>
            <div>
              <dt>技术栈</dt>
              <dd className="fact-tags">
                {project.tags.map((tag, index) => (
                  <span key={index}>{tag}</span>
                ))}
              </dd>
            </div>
          </dl>
          {(project.links?.demo || project.links?.source) && (
            <div className="project-links">
              {project.links.demo && (
                <a
                  className="text-link"
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  在线体验 <ArrowUpRight size={18} />
                  <span className="sr-only">（新窗口）</span>
                </a>
              )}
              {project.links.source && (
                <a
                  className="text-link"
                  href={project.links.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  查看源码 <ArrowUpRight size={18} />
                  <span className="sr-only">（新窗口）</span>
                </a>
              )}
            </div>
          )}
          {project.miniProgramCode && (
            <figure className="mini-code">
              <button onClick={() => setImage(project.miniProgramCode!)} aria-label="放大小程序码">
                <ProjectImage image={project.miniProgramCode} />
              </button>
              <figcaption>扫码体验小程序</figcaption>
            </figure>
          )}
          {project.isDemo && (
            <p className="concept-note">
              这是用于展示网站设计的示例案例，内容与配图不代表真实项目经历。
            </p>
          )}
        </aside>
        <div className="case-content">
          {project.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              {section.features && (
                <div className="feature-list">
                  {section.features.map((feature, index) => (
                    <article key={index}>
                      <Plus size={21} weight="light" aria-hidden="true" />
                      <div>
                        <h3>{feature.title}</h3>
                        <p>{feature.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {section.steps && (
                <ol className="architecture">
                  {section.steps.map((step, index) => (
                    <li key={index}>
                      <span>{step}</span>
                      {index < section.steps!.length - 1 && (
                        <ArrowRight aria-hidden="true" size={17} />
                      )}
                    </li>
                  ))}
                </ol>
              )}
              {section.disclosure && (
                <details className="technical-note">
                  <summary>
                    {section.disclosure.title}
                    <Plus size={18} aria-hidden="true" />
                  </summary>
                  <p>{section.disclosure.text}</p>
                </details>
              )}
            </section>
          ))}
          {Boolean(project.gallery?.length) && (
            <section>
              <h2>更多项目截图</h2>
              <div className="project-gallery">
                {project.gallery!.map((item, index) => (
                  <figure key={index}>
                    <button onClick={() => setImage(item)} aria-label={`放大：${item.alt}`}>
                      <ProjectImage image={item} />
                    </button>
                    <figcaption>{item.alt}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      {next && (
        <Link className="next-project" to={`/projects/${next.slug}`}>
          <span>
            <small>下一个项目</small>
            <strong>
              {next.name}
              <span>{next.subtitle}</span>
            </strong>
          </span>
          <ArrowUpRight size={50} weight="light" />
        </Link>
      )}
      <ImageDialog image={image} onClose={() => setImage(null)} />
    </main>
  );
}

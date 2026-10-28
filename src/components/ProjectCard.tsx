import { ArrowUpRight } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { usePortfolio } from '../content/ContentProvider';
import { categoryLabel } from '../content/schema';
import type { Project } from '../content/schema';
import { ProjectImage } from './ProjectImage';

export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  const content = usePortfolio();
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="project-card"
      aria-label={`查看 ${project.name} 项目详情`}
    >
      <div className="card-media">
        <ProjectImage image={project.cover} color={project.color} priority={priority} />
        <span className="image-action" aria-hidden="true">
          <ArrowUpRight size={25} />
        </span>
      </div>
      <div className="card-caption">
        <div className="card-copy">
          <div className="project-category">
            {categoryLabel(content, project.category)}
            <span>{project.year}</span>
          </div>
          <h3>
            {project.name}
            <span>{project.subtitle}</span>
          </h3>
          <p>{project.description}</p>
        </div>
        <span className="card-arrow" aria-hidden="true">
          <ArrowUpRight size={25} />
        </span>
      </div>
    </Link>
  );
}

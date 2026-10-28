import type { Project } from './schema';

// Explicit chapter images take precedence. Older gallery-only JSON remains readable
// as an illustrated case study without requiring a content migration.
export function projectSections(project: Project) {
  const sections = project.sections.map((section) => ({
    ...section,
    images: [...(section.images ?? [])],
  }));
  const assigned = new Set(sections.flatMap((section) => section.images.map(({ url }) => url)));
  const gallery = (project.gallery ?? []).filter(({ url }) => !assigned.has(url));
  gallery.forEach((image, index) => {
    sections[Math.floor((index * sections.length) / gallery.length)].images.push(image);
  });
  return sections;
}

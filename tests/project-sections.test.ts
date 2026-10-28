import { describe, expect, it } from 'vitest';
import { readContent } from '../scripts/content-io';
import { projectSections } from '../src/content/project-sections';

const sample = (await readContent()).projects[0];
const image = (index: number) => ({ url: `/images/${index}.png`, alt: `截图 ${index}` });
const fixture = () => ({
  ...structuredClone(sample),
  sections: Array.from({ length: 3 }, (_, index) => ({
    id: `chapter-${index}`,
    title: `章节 ${index}`,
    paragraphs: ['项目介绍'],
  })),
});

describe('illustrated project chapters', () => {
  it('spreads legacy images through the text without losing order or mutating source', () => {
    const project = { ...fixture(), gallery: [image(0), image(1)] };
    const original = structuredClone(project);
    expect(projectSections(project).map(({ images }) => images)).toEqual([
      [image(0)],
      [image(1)],
      [],
    ]);
    expect(project).toEqual(original);
  });
  it('retains explicit placement and skips gallery URLs already assigned to a chapter', () => {
    const project = fixture();
    const result = projectSections({
      ...project,
      gallery: [image(0), image(1)],
      sections: project.sections.map((section, index) => ({
        ...section,
        images: index === 2 ? [image(0)] : [],
      })),
    });
    expect(result.map(({ images }) => images)).toEqual([[image(1)], [], [image(0)]]);
    expect(projectSections(fixture()).every(({ images }) => images.length === 0)).toBe(true);
  });
  it('handles more images than chapters, including a single chapter', () => {
    const gallery = Array.from({ length: 7 }, (_, index) => image(index));
    const project = { ...fixture(), gallery };
    expect(projectSections(project).flatMap(({ images }) => images)).toEqual(gallery);
    expect(
      projectSections({ ...project, sections: project.sections.slice(0, 1) })[0].images,
    ).toEqual(gallery);
  });
});

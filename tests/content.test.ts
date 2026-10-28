import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  imageUrlSchema,
  parsePortfolio,
  publishedPortfolio,
  filterProjects,
} from '../src/content/schema';
import { readContent, schemas, exportContent, validateAssets } from '../scripts/content-io';

const sample = await readContent();
const clone = () => structuredClone(sample);

describe('versioned content contract', () => {
  it('keeps generated JSON schemas in sync with runtime validation', async () => {
    for (const [file, schema] of Object.entries(schemas()))
      expect(JSON.parse(await readFile(`public/content/${file}`, 'utf8'))).toEqual(schema);
  });
  it.each([
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    '//evil.example/x.png',
    'http://example.com/a.png',
    'https://user:password@example.com/a.png',
    'https://',
    '/images/a%2fb.png',
  ])('rejects unsafe image reference %s', (value) => {
    expect(imageUrlSchema.safeParse(value).success).toBe(false);
  });
  it.each(['https://cdn.example.com/a.webp?width=800', '/images/coffee.png'])(
    'accepts image URL %s',
    (value) => {
      expect(imageUrlSchema.safeParse(value).success).toBe(true);
    },
  );
  it('rejects unknown fields and schema versions', () => {
    expect(() => parsePortfolio({ ...clone(), schemaVersion: 2 })).toThrow();
    expect(() => parsePortfolio({ ...clone(), apiKey: 'not-a-real-key' })).toThrow();
  });
  it('rejects ambiguous project slugs, categories, sections and featured projects', () => {
    const duplicate = clone();
    duplicate.projects[1].slug = duplicate.projects[0].slug;
    expect(() => parsePortfolio(duplicate)).toThrow('重复标识');
    const category = clone();
    category.projects[0].category = 'missing';
    expect(() => parsePortfolio(category)).toThrow('分类不存在');
    const sections = clone();
    sections.projects[0].sections.push(sections.projects[0].sections[0]);
    expect(() => parsePortfolio(sections)).toThrow('重复标识');
    const featured = clone();
    featured.projects[1].featured = true;
    expect(() => parsePortfolio(featured)).toThrow('最多设置一个');
  });
  it('publishes only visible projects in configured order without mutating source', () => {
    const content = clone();
    content.projects[0].status = 'draft';
    content.projects[2].sortOrder = 1;
    const original = structuredClone(content);
    expect(publishedPortfolio(content).projects.map((project) => project.slug)).toEqual([
      'trail',
      'atlas',
    ]);
    content.projects[2].status = 'archived';
    expect(publishedPortfolio(content).projects.map((project) => project.slug)).toEqual(['atlas']);
    expect(original.projects[0].status).toBe('draft');
    expect(content.projects[0].slug).toBe('mori');
  });
  it('supports no projects and searches title and technologies with category filters', () => {
    expect(parsePortfolio({ ...clone(), projects: [] }).projects).toEqual([]);
    expect(
      filterProjects(sample.projects, 'web', '  aTLAS  ').map((project) => project.slug),
    ).toEqual(['atlas']);
    expect(filterProjects(sample.projects, 'mini-program', 'atlas')).toEqual([]);
  });
  it('checks published local images and confines them to public', async () => {
    await expect(validateAssets(sample)).resolves.toBeUndefined();
    const missing = clone();
    missing.projects[0].cover.url = '/images/not-found.webp';
    await expect(validateAssets(missing)).rejects.toThrow('找不到图片');
    missing.projects[0].status = 'draft';
    await expect(validateAssets(missing)).resolves.toBeUndefined();
    missing.projects[0].status = 'published';
    missing.projects[0].cover.url = '/../package.json';
    await expect(validateAssets(missing)).rejects.toThrow('不能超出');
  });
  it('validates chapter image URLs and checks their local files', async () => {
    const content = clone();
    content.projects[0].sections[0].images = [
      { url: '/images/missing-section.png', alt: '章节配图' },
    ];
    expect(parsePortfolio(content).projects[0].sections[0].images).toHaveLength(1);
    await expect(validateAssets(content)).rejects.toThrow('找不到图片');
    content.projects[0].sections[0].images[0].url = 'javascript:alert(1)';
    expect(() => parsePortfolio(content)).toThrow('images');
  });
  it('new/export CLI preserves drafts in source but excludes them from public output', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'work-show-content-'));
    try {
      await exportContent(sample, directory);
      const file = join(directory, 'portfolio.json');
      execFileSync(process.execPath, [
        '--import',
        'tsx',
        'scripts/content.ts',
        'new',
        'new-case',
        '--file',
        file,
      ]);
      const content = await readContent(file);
      expect(content.projects.at(-1)?.status).toBe('draft');
      expect(() =>
        execFileSync(
          process.execPath,
          ['--import', 'tsx', 'scripts/content.ts', 'new', 'new-case', '--file', file],
          { stdio: 'pipe' },
        ),
      ).toThrow();
      const out = join(directory, 'published');
      execFileSync(process.execPath, [
        '--import',
        'tsx',
        'scripts/content.ts',
        'export',
        '--file',
        file,
        '--out',
        out,
      ]);
      expect(
        (await readContent(join(out, 'portfolio.json'))).projects.some(
          (project) => project.slug === 'new-case',
        ),
      ).toBe(false);
      expect((await readContent(file)).projects).toHaveLength(4);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

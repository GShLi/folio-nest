import { z } from 'zod';

const text = (max: number) => z.string().min(1).max(max);
const slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
// URLs are public, read-only assets. No data:, javascript:, protocol-relative URLs or credentials.
const externalUrl = z
  .string()
  .max(2048)
  .regex(/^https:\/\/[^\s\\@]+$/)
  .url();
export const imageUrlSchema = z.union([
  externalUrl,
  z
    .string()
    .min(2)
    .max(2048)
    .regex(/^\/(?!\/)[^\s\\?#%]+$/),
]);
export const imageSchema = z.strictObject({
  url: imageUrlSchema.describe('图片的 HTTPS 链接，或站内 /images/... 路径。不支持 base64。'),
  alt: text(200).describe('图片内容描述，供无障碍阅读与加载失败时使用。'),
});

export const sectionSchema = z.strictObject({
  id: slug,
  title: text(100),
  paragraphs: z.array(text(5000)).min(1).max(20),
  features: z
    .array(z.strictObject({ title: text(100), text: text(2000) }))
    .max(12)
    .optional(),
  steps: z.array(text(100)).min(2).max(8).optional(),
  disclosure: z.strictObject({ title: text(100), text: text(5000) }).optional(),
});

export const projectSchema = z.strictObject({
  $schema: z.string().optional(),
  slug: slug.describe('永久链接标识。发布后尽量不改，例如 coffee-mini-app。'),
  name: text(80),
  subtitle: text(100),
  category: slug.describe('必须引用 categories 中已有的 id。'),
  description: text(240),
  summary: text(2000),
  year: z.string().regex(/^20\d{2}$/),
  status: z.enum(['draft', 'published', 'archived']),
  sortOrder: z.number().int().min(0).max(100000),
  featured: z.boolean(),
  isDemo: z.boolean(),
  cover: imageSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  tags: z.array(text(50)).min(1).max(20),
  role: text(150),
  duration: text(100),
  sections: z.array(sectionSchema).min(1).max(16),
  gallery: z.array(imageSchema).max(20).optional(),
  links: z
    .strictObject({ demo: externalUrl.optional(), source: externalUrl.optional() })
    .optional(),
  miniProgramCode: imageSchema.optional(),
});

export const portfolioSchema = z.strictObject({
  $schema: z.string().optional(),
  schemaVersion: z.literal(1),
  site: z.strictObject({
    name: text(60),
    monogram: text(6),
    title: text(120),
    description: text(300),
    publicUrl: externalUrl
      .optional()
      .describe('正式网站根地址，例如 https://portfolio.example.com。'),
    tagline: text(100),
    footer: text(200),
    isDemo: z.boolean(),
    hero: z.strictObject({
      eyebrow: text(80),
      heading: z.array(text(30)).min(1).max(2),
      description: text(300),
    }),
  }),
  categories: z
    .array(z.strictObject({ id: slug, label: text(30) }))
    .min(1)
    .max(20),
  projects: z.array(projectSchema).max(200),
});

export type Portfolio = z.infer<typeof portfolioSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ImageAsset = z.infer<typeof imageSchema>;

export class ContentValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`内容校验失败：\n${issues.join('\n')}`);
    this.name = 'ContentValidationError';
  }
}

export function parsePortfolio(input: unknown): Portfolio {
  const result = portfolioSchema.safeParse(input);
  if (!result.success) {
    throw new ContentValidationError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }
  const content = result.data;
  const issues: string[] = [];
  const unique = (values: string[], path: string) => {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (seen.has(value)) issues.push(`${path}.${index}: 重复标识 ${value}`);
      seen.add(value);
    });
  };
  unique(
    content.categories.map((category) => category.id),
    'categories',
  );
  unique(
    content.projects.map((project) => project.slug),
    'projects',
  );
  if (content.site.publicUrl) {
    const url = new URL(content.site.publicUrl);
    if (url.pathname !== '/' || url.search || url.hash)
      issues.push('site.publicUrl: 请填写网站根地址，不包含路径、查询或锚点');
  }
  content.projects.forEach((project, index) => {
    if (!content.categories.some((category) => category.id === project.category))
      issues.push(`projects.${index}.category: 分类不存在`);
    unique(
      project.sections.map((section) => section.id),
      `projects.${index}.sections`,
    );
  });
  if (
    content.projects.filter((project) => project.status === 'published' && project.featured)
      .length > 1
  ) {
    issues.push('projects: 最多设置一个已发布作品为首页精选 featured');
  }
  if (issues.length) throw new ContentValidationError(issues);
  return content;
}

export function publishedPortfolio(content: Portfolio): Portfolio {
  return {
    ...content,
    $schema: './portfolio.schema.json',
    projects: content.projects
      .filter((project) => project.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug)),
  };
}

export function categoryLabel(content: Portfolio, category: string) {
  return content.categories.find((item) => item.id === category)?.label ?? category;
}

export function filterProjects(projects: Project[], category: string, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  return projects.filter(
    (project) =>
      (!category || project.category === category) &&
      `${project.name} ${project.subtitle} ${project.description} ${project.tags.join(' ')}`
        .toLocaleLowerCase()
        .includes(normalized),
  );
}

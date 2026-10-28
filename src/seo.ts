import type { Portfolio } from './content/schema';

export function metadata(content: Portfolio, pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const project = content.projects.find((item) => `/projects/${item.slug}` === path);
  const exists = path === '/' || path === '/projects' || Boolean(project);
  const base = content.site.publicUrl;
  const title = project
    ? `${project.name} · ${project.subtitle} / ${content.site.name}`
    : path === '/'
      ? content.site.title
      : path === '/projects'
        ? `作品 / ${content.site.name}`
        : `页面未找到 / ${content.site.name}`;
  const description = project?.description ?? content.site.description;
  const image =
    project?.cover ??
    content.projects.find((item) => item.featured)?.cover ??
    content.projects[0]?.cover;
  return {
    title,
    description,
    robots:
      !exists || content.site.isDemo || project?.isDemo ? 'noindex, nofollow' : 'index, follow',
    canonical: exists && base ? new URL(path, base).href : undefined,
    image:
      image && (base || image.url.startsWith('https://'))
        ? new URL(image.url, base).href
        : undefined,
    imageAlt: image?.alt,
    type: project ? 'article' : 'website',
  };
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
}

export function serializeJson(value: unknown) {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

export function renderHead(content: Portfolio, path: string) {
  const meta = metadata(content, path);
  const tag = (key: string, value: string, property = false) =>
    `<meta ${property ? 'property' : 'name'}="${key}" content="${escapeHtml(value)}">`;
  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    tag('description', meta.description),
    tag('robots', meta.robots),
    tag('og:title', meta.title, true),
    tag('og:description', meta.description, true),
    tag('og:type', meta.type, true),
    tag('og:locale', 'zh_CN', true),
    tag('twitter:card', meta.image ? 'summary_large_image' : 'summary'),
    ...(meta.canonical
      ? [
          `<link rel="canonical" href="${escapeHtml(meta.canonical)}">`,
          tag('og:url', meta.canonical, true),
        ]
      : []),
    ...(meta.image
      ? [tag('og:image', meta.image, true), tag('og:image:alt', meta.imageAlt ?? '', true)]
      : []),
  ].join('\n');
}

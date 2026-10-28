import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, loadEnv } from 'vite';
import { fetchPortfolio } from '../src/content/load';
import { publishedPortfolio } from '../src/content/schema';
import type { Portfolio } from '../src/content/schema';
import { escapeHtml, renderHead, serializeJson } from '../src/seo';
import { exportContent, readContent, validateAssets, writeSchemas } from './content-io';

async function main() {
  const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
  const source = env.VITE_CONTENT_URL?.trim();
  let content: Portfolio;
  if (source && source !== '/content/portfolio.json') {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash)
      throw new Error('VITE_CONTENT_URL 必须是公开 HTTPS JSON 地址，或留空使用本地文件');
    content = await fetchPortfolio(source);
  } else content = publishedPortfolio(await readContent());
  await validateAssets(content);
  await writeSchemas();
  await build();
  await build({
    build: {
      ssr: 'src/entry-server.tsx',
      outDir: '.cache/ssr',
      emptyOutDir: true,
      copyPublicDir: false,
    },
  });
  const { render } = (await import(pathToFileURL(resolve('.cache/ssr/entry-server.js')).href)) as {
    render: (path: string, content: Portfolio) => string;
  };
  const template = await readFile('dist/index.html', 'utf8');
  for (const marker of ['<!--app-head-->', '<!--app-html-->', '<!--app-data-->'])
    if (!template.includes(marker)) throw new Error(`HTML 模板缺少标记 ${marker}`);
  const routes = [
    '/',
    '/projects',
    ...content.projects.map((project) => `/projects/${project.slug}`),
  ];
  for (const path of [...routes, '/404']) {
    const html = template
      .replace('<!--app-head-->', () => renderHead(content, path))
      .replace('<!--app-html-->', () => render(path, content))
      .replace(
        '<!--app-data-->',
        () =>
          `<script id="portfolio-data" type="application/json">${serializeJson({ path, content })}</script>`,
      );
    const target = path === '/404' ? 'dist/404.html' : resolve('dist', `.${path}`, 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html);
  }
  await exportContent(content, 'dist/content');
  const publicUrl = content.site.publicUrl;
  const indexableRoutes = content.site.isDemo
    ? []
    : routes.filter(
        (path) => !content.projects.find((project) => `/projects/${project.slug}` === path)?.isDemo,
      );
  if (publicUrl) {
    await writeFile(
      'dist/sitemap.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexableRoutes.map((path) => `<url><loc>${escapeHtml(new URL(path, publicUrl).href)}</loc></url>`).join('')}</urlset>\n`,
    );
  }
  await writeFile(
    'dist/robots.txt',
    `User-agent: *\nAllow: /\n${publicUrl ? `Sitemap: ${new URL('/sitemap.xml', publicUrl).href}\n` : ''}`,
  );
  console.log(`\n已生成 ${routes.length} 个静态页面、404 页面和公开 JSON。`);
  if (!publicUrl)
    console.warn(
      '尚未配置 site.publicUrl：暂不生成 canonical 和 sitemap；上线前填写实际域名并重新构建。',
    );
  if (content.site.isDemo)
    console.warn('当前为示例作品集，页面设为 noindex；替换真实内容后将 site.isDemo 改为 false。');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

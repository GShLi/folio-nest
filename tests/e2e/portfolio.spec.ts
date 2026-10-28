import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readContent } from '../../scripts/content-io';
const content = await readContent();

test('clean routes, filters, details, image dialog, and persisted theme', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('做成好用的产品');
  await page.evaluate(() => document.fonts.ready);
  const main = page.locator('main');
  await expect(main).toHaveCSS('opacity', '1');
  await expect(page.locator('.editorial-feature img')).toBeVisible();
  const before = await page.locator('.editorial-feature').boundingBox();
  await page.getByRole('button', { name: '切换到深色模式' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-style', 'studio');
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => {}))),
  );
  expect(await page.locator('.editorial-feature').boundingBox()).toEqual(before);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-home-dark.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.reload();
  await expect(page.getByRole('button', { name: '切换到浅色模式' })).toBeVisible();
  await page.getByRole('button', { name: '切换到浅色模式' }).click();
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-home-light.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('link', { name: '探索作品' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.getByRole('button', { name: /Web 应用/ }).click();
  await expect(page.locator('.project-card')).toHaveCount(2);
  await page.getByRole('searchbox', { name: '搜索作品' }).fill('ATLAS');
  await expect(page.locator('.project-card')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('ATLAS');
  await page.getByRole('link', { name: '查看 ATLAS 项目详情' }).click();
  await expect(page).toHaveURL(/\/projects\/atlas$/);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ATLAS');
  await page.getByRole('button', { name: '查看项目大图' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '查看项目大图' })).toBeFocused();
  await page.locator('summary').click();
  await expect(page.locator('details')).toHaveAttribute('open', '');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-detail.png`,
    fullPage: true,
    animations: 'disabled',
  });
  expect(await main.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test('accessible home, list and detail in both themes', async ({ page }) => {
  for (const path of ['/', '/projects', '/projects/mori']) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('main')).toHaveCSS('opacity', '1');
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: '切换到深色模式' }).click();
      await page.evaluate(() =>
        Promise.all(
          document.getAnimations().map((animation) => animation.finished.catch(() => {})),
        ),
      );
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
      if (theme === 'dark') await page.getByRole('button', { name: '切换到浅色模式' }).click();
    }
  }
});

test('legacy links and missing pages', async ({ page }) => {
  await page.goto('/#/studio/work/trail');
  await expect(page).toHaveURL(/\/projects\/trail$/);
  await expect(page.locator('html')).toHaveAttribute('data-style', 'studio');
  await expect(page.locator('main h1')).toContainText('TRAIL');
  await page.goto('/projects/missing');
  await expect(page.locator('main h1')).toHaveText('这个页面还没有收录');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('malformed JSON keeps the published snapshot and retry recovers', async ({ page }) => {
  await page.route('**/content/portfolio.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{"schemaVersion": 999}' }),
  );
  await page.goto('/projects/mori');
  await expect(page.getByRole('status')).toContainText('内容更新暂时失败');
  await expect(page.locator('main h1')).toContainText('MORI');
  await page.unroute('**/content/portfolio.json');
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await expect(page.locator('.content-notice')).toHaveCount(0);
});

test('JSON controls publication, optional project links, gallery and QR code', async ({ page }) => {
  const data = structuredClone(content);
  data.projects[0].status = 'draft';
  data.projects[1].links = {
    demo: 'https://example.com/demo',
    source: 'https://example.com/source',
  };
  data.projects[1].gallery = [{ url: '/images/atlas.png', alt: '项目搜索界面截图' }];
  data.projects[1].miniProgramCode = { url: '/images/trail.png', alt: '测试用小程序码图片' };
  await page.route('**/content/portfolio.json', (route) => route.fulfill({ json: data }));
  await page.goto('/projects');
  await expect(page.locator('.project-card')).toHaveCount(2);
  await page.getByRole('link', { name: '查看 ATLAS 项目详情' }).click();
  await expect(page.getByRole('link', { name: /在线体验/ })).toHaveAttribute(
    'href',
    'https://example.com/demo',
  );
  await expect(page.getByRole('link', { name: /查看源码/ })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await page.getByRole('button', { name: '放大：项目搜索界面截图' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '关闭大图' }).click();
  await page.getByRole('button', { name: '放大小程序码' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goto('/projects/mori');
  await expect(page.locator('main h1')).toContainText('这个页面还没有收录');
});

test('empty data, broken image, and no search results remain usable', async ({ page }) => {
  await page.route('**/images/coffee.png', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.image-fallback')).toContainText('图片暂时无法加载');
  await page.goto('/projects?q=does-not-exist');
  await expect(page.getByRole('heading', { name: '还没有找到这个作品' })).toBeVisible();
  await page.getByRole('button', { name: /重置筛选/ }).click();
  await expect(page.locator('.project-card')).toHaveCount(3);
  await page.route('**/content/portfolio.json', (route) =>
    route.fulfill({ json: { ...content, projects: [] } }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '新的作品，正在路上。' })).toBeVisible();
  await page.getByRole('link', { name: '探索作品' }).click();
  await expect(page.getByRole('heading', { name: '作品正在准备中' })).toBeVisible();
});

test('prerendered details are readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/projects/mori/`);
  await expect(page.locator('h1')).toContainText('MORI');
  await expect(page.locator('.detail-cover img')).toBeVisible();
  await expect(page).toHaveTitle(/MORI/);
  await context.close();
});

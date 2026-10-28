import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { z } from 'zod';
import {
  parsePortfolio,
  portfolioSchema,
  projectSchema,
  publishedPortfolio,
} from '../src/content/schema';
import type { Portfolio } from '../src/content/schema';
import { MAX_CONTENT_BYTES } from '../src/content/load';

export const defaultContentFile = 'public/content/portfolio.json';
export const formatJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
export const schemas = () => ({
  'portfolio.schema.json': z.toJSONSchema(portfolioSchema, { target: 'draft-2020-12' }),
  'project.schema.json': z.toJSONSchema(projectSchema, { target: 'draft-2020-12' }),
});

export async function writeSchemas(directory = 'public/content') {
  await mkdir(directory, { recursive: true });
  for (const [name, schema] of Object.entries(schemas()))
    await writeFile(resolve(directory, name), formatJson(schema));
}

export async function readContent(file = defaultContentFile) {
  const details = await stat(file);
  if (details.size > MAX_CONTENT_BYTES) throw new Error('内容文件超过 2 MB 限制');
  return parsePortfolio(JSON.parse(await readFile(file, 'utf8')));
}

export async function validateAssets(content: Portfolio, directory = 'public') {
  const root = await realpath(directory);
  for (const project of publishedPortfolio(content).projects) {
    const images = [
      project.cover,
      ...(project.gallery ?? []),
      ...(project.miniProgramCode ? [project.miniProgramCode] : []),
    ];
    for (const image of images) {
      if (!image.url.startsWith('/')) continue;
      const path = resolve(root, `.${image.url}`);
      if (!path.startsWith(`${root}${sep}`))
        throw new Error(`${project.slug}: 图片路径不能超出 public 目录：${image.url}`);
      let actualPath: string;
      try {
        actualPath = await realpath(path);
      } catch {
        throw new Error(`${project.slug}: 找不到图片 ${image.url}`);
      }
      if (!actualPath.startsWith(`${root}${sep}`) || !(await stat(actualPath)).isFile())
        throw new Error(`${project.slug}: 无效图片路径 ${image.url}`);
    }
  }
}

export async function exportContent(content: Portfolio, directory: string) {
  await writeSchemas(directory);
  const target = resolve(directory, 'portfolio.json');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, formatJson(publishedPortfolio(content)));
  return target;
}

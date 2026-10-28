import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { parsePortfolio, projectSchema } from '../src/content/schema';
import {
  defaultContentFile,
  exportContent,
  formatJson,
  readContent,
  validateAssets,
  writeSchemas,
} from './content-io';

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { file: { type: 'string' }, out: { type: 'string' } },
  });
  const [command, slug] = positionals;
  const file = resolve(values.file ?? defaultContentFile);
  if (command === 'schema') {
    await writeSchemas();
    console.log('已生成 JSON Schema v1。');
    return;
  }
  const content = await readContent(file);
  if (command === 'validate') {
    await validateAssets(content);
    console.log(
      `内容校验通过：${content.projects.length} 个项目，${content.projects.filter((project) => project.status === 'published').length} 个已发布。`,
    );
  } else if (command === 'new') {
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw new Error('用法：pnpm content:new my-project（使用小写英文、数字和连字符）');
    if (content.projects.some((project) => project.slug === slug))
      throw new Error(`项目标识已存在：${slug}`);
    const template = projectSchema.parse(
      JSON.parse(await readFile('content/project.template.json', 'utf8')),
    );
    const { $schema: _schema, ...fields } = template;
    content.projects.push({
      ...fields,
      slug,
      sortOrder: Math.max(0, ...content.projects.map((project) => project.sortOrder)) + 10,
    });
    parsePortfolio(content);
    // Validate first, then atomically replace the original file.
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, formatJson(content), { flag: 'wx' });
    await rename(temporary, file);
    console.log(
      `已添加草稿 ${slug} → ${file}\n填写内容后将 status 改为 published，再运行 pnpm content:validate。`,
    );
  } else if (command === 'export') {
    await validateAssets(content);
    const directory = resolve(values.out ?? '.output/content');
    if (directory === resolve('public/content'))
      throw new Error('请导出到其他目录，避免覆盖含草稿的源文件');
    console.log(`已导出公开内容：${await exportContent(content, directory)}`);
  } else throw new Error('支持的命令：schema、validate、new <slug>、export [--out directory]');
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import { expect, it } from 'vitest';
import { metadata, renderHead, serializeJson } from '../src/seo';
import { readContent } from '../scripts/content-io';
const sample = await readContent();
it('renders per-project metadata and excludes demos and missing pages from indexing', () => {
  const content = structuredClone(sample);
  content.site.publicUrl = 'https://portfolio.example.com';
  content.site.isDemo = false;
  content.projects[0].isDemo = false;
  const meta = metadata(content, '/projects/mori/');
  expect(meta.title).toContain('MORI');
  expect(meta.canonical).toBe('https://portfolio.example.com/projects/mori');
  expect(meta.image).toBe('https://portfolio.example.com/images/coffee.png');
  expect(meta.robots).toBe('index, follow');
  expect(metadata(content, '/projects/atlas').robots).toContain('noindex');
  expect(metadata(content, '/missing').canonical).toBeUndefined();
  expect(metadata(content, '/missing').robots).toContain('noindex');
});
it('escapes user content in HTML and JSON script snapshots', () => {
  const content = structuredClone(sample);
  content.site.title = '</title><script>alert("x")</script>';
  expect(renderHead(content, '/')).not.toContain('<script>');
  const serialized = serializeJson({ text: '</script><script>alert(1)</script>&\u2028' });
  expect(serialized).not.toContain('</script>');
  expect(JSON.parse(serialized).text).toContain('</script>');
});

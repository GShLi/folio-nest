import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPortfolio, MAX_CONTENT_BYTES } from '../src/content/load';
import { readContent } from '../scripts/content-io';
const content = await readContent();
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const respond = (body: string, headers = { 'content-type': 'application/json' }) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { headers })));

describe('public JSON loading', () => {
  it('validates and filters external data', async () => {
    const draft = structuredClone(content);
    draft.projects[0].status = 'draft';
    respond(JSON.stringify(draft));
    expect((await fetchPortfolio('https://cdn.example.com/portfolio.json')).projects).toHaveLength(
      2,
    );
  });
  it('reports HTML fallbacks, invalid JSON, invalid schema and HTTP errors', async () => {
    respond('<html>not json</html>', { 'content-type': 'text/html' });
    await expect(fetchPortfolio('/content.json')).rejects.toThrow('返回 JSON');
    respond('{bad');
    await expect(fetchPortfolio('/content.json')).rejects.toThrow();
    respond('{}');
    await expect(fetchPortfolio('/content.json')).rejects.toThrow('内容校验失败');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(fetchPortfolio('/content.json')).rejects.toThrow('404');
  });
  it('limits both declared and streamed response sizes', async () => {
    respond('{}', {
      'content-type': 'application/json',
      'content-length': String(MAX_CONTENT_BYTES + 1),
    } as { 'content-type': string });
    await expect(fetchPortfolio('/content.json')).rejects.toThrow('2 MB');
    respond(' '.repeat(MAX_CONTENT_BYTES + 1));
    await expect(fetchPortfolio('/content.json')).rejects.toThrow('2 MB');
  });
  it('aborts stalled requests and forwards caller cancellation', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = options.signal!;
            if (signal.aborted) reject(signal.reason);
            else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          }),
      ),
    );
    const slow = expect(fetchPortfolio('/content.json')).rejects.toThrow('超时');
    await vi.advanceTimersByTimeAsync(12000);
    await slow;
    const controller = new AbortController();
    const cancelled = expect(fetchPortfolio('/content.json', controller.signal)).rejects.toThrow(
      'cancel',
    );
    controller.abort(new Error('cancel'));
    await cancelled;
  });
});

import { parsePortfolio, publishedPortfolio } from './schema';
import type { Portfolio } from './schema';

export const MAX_CONTENT_BYTES = 2 * 1024 * 1024;

export async function fetchPortfolio(url: string, signal?: AbortSignal): Promise<Portfolio> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(() => controller.abort(new Error('内容加载超时')), 12000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'error',
    });
    if (!response.ok) throw new Error(`内容请求失败（HTTP ${response.status}）`);
    if (!/application\/(?:[\w.-]+\+)?json\b/i.test(response.headers.get('content-type') ?? '')) {
      throw new Error('内容地址必须返回 JSON，而不是网页');
    }
    if (Number(response.headers.get('content-length') ?? 0) > MAX_CONTENT_BYTES)
      throw new Error('内容文件超过 2 MB 限制');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('内容响应为空');
    const decoder = new TextDecoder();
    let text = '';
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_CONTENT_BYTES) {
          await reader.cancel();
          throw new Error('内容文件超过 2 MB 限制');
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    return publishedPortfolio(parsePortfolio(JSON.parse(text)));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export function contentUrl() {
  return (
    import.meta.env.VITE_CONTENT_URL?.trim() || `${import.meta.env.BASE_URL}content/portfolio.json`
  );
}

export function assetUrl(url: string) {
  return url.startsWith('/') ? `${import.meta.env.BASE_URL}${url.slice(1)}` : url;
}

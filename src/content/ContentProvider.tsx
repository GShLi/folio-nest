import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Portfolio } from './schema';
import { contentUrl, fetchPortfolio } from './load';

interface ContentState {
  content: Portfolio | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const Context = createContext<ContentState | null>(null);

export function ContentProvider({
  initialContent,
  children,
}: {
  initialContent?: Portfolio;
  children: ReactNode;
}) {
  const [content, setContent] = useState<Portfolio | null>(initialContent ?? null);
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const request = ++sequence.current;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchPortfolio(contentUrl(), controller.signal)
      .then((next) => {
        if (request === sequence.current && !controller.signal.aborted) setContent(next);
      })
      .catch((reason) => {
        if (!controller.signal.aborted && request === sequence.current) {
          console.error('Portfolio content could not be loaded:', reason);
          setError('作品内容暂时无法加载，请稍后重试。');
        }
      })
      .finally(() => {
        if (request === sequence.current && !controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  return (
    <Context.Provider value={{ content, loading, error, reload }}>{children}</Context.Provider>
  );
}

export function useContentState() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing ContentProvider');
  return value;
}

export function usePortfolio() {
  const { content } = useContentState();
  if (!content) throw new Error('Portfolio content is not ready');
  return content;
}

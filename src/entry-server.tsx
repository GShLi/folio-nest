import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import type { Portfolio } from './content/schema';
import App from './App';

export function render(path: string, content: Portfolio) {
  return renderToString(
    <StaticRouter location={path}>
      <App initialContent={content} />
    </StaticRouter>,
  );
}

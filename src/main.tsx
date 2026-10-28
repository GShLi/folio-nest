import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './styles.css';
import App from './App';
import { parsePortfolio, publishedPortfolio } from './content/schema';
import type { Portfolio } from './content/schema';

// Keep links from the original design demo working.
const legacy = window.location.hash.match(
  /^#\/(editorial|studio)(?:\/work(?:\/([a-z0-9-]+))?)?\/?$/,
);
if (legacy) {
  try {
    localStorage.setItem('work-show-theme', legacy[1] === 'studio' ? 'dark' : 'light');
  } catch {
    /* Optional browser storage. */
  }
  const path = legacy[2]
    ? `/projects/${legacy[2]}`
    : window.location.hash.includes('/work')
      ? '/projects'
      : '/';
  window.history.replaceState(null, '', path);
}

let initialContent: Portfolio | undefined;
let canHydrate = false;
const bootstrap = document.getElementById('portfolio-data');
if (bootstrap?.textContent) {
  try {
    const snapshot = JSON.parse(bootstrap.textContent);
    initialContent = publishedPortfolio(parsePortfolio(snapshot.content));
    canHydrate =
      snapshot.path === (window.location.pathname.replace(/\/+$/, '') || '/') &&
      !window.location.search;
  } catch (error) {
    console.error('Invalid build snapshot:', error);
  }
}
const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App initialContent={initialContent} />
    </BrowserRouter>
  </StrictMode>
);
if (canHydrate && root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

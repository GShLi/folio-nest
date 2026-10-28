import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { usePortfolio } from '../content/ContentProvider';
import { metadata } from '../seo';

export function Seo() {
  const content = usePortfolio();
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = metadata(content, pathname);
    document.title = meta.title;
    const update = (key: string, value?: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!value) {
        element?.remove();
        return;
      }
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = value;
    };
    update('description', meta.description);
    update('robots', meta.robots);
    update('og:title', meta.title, true);
    update('og:description', meta.description, true);
    update('og:type', meta.type, true);
    update('og:locale', 'zh_CN', true);
    update('og:url', meta.canonical, true);
    update('og:image', meta.image, true);
    update('og:image:alt', meta.image ? meta.imageAlt : undefined, true);
    update('twitter:card', meta.image ? 'summary_large_image' : 'summary');
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (meta.canonical) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = meta.canonical;
    } else canonical?.remove();
  }, [content, pathname]);
  return null;
}

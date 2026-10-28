import { useEffect, useRef, useState } from 'react';
import type { ImageAsset } from '../content/schema';
import { assetUrl } from '../content/load';

export function ProjectImage({
  image,
  color,
  priority = false,
}: {
  image: ImageAsset;
  color?: string;
  priority?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A prerendered image may fail before React attaches its error listener.
    if (ref.current?.complete && ref.current.naturalWidth === 0) setFailedUrl(image.url);
  }, [image.url]);
  return (
    <div className="project-image loaded" style={{ backgroundColor: color }}>
      {failedUrl !== image.url ? (
        <img
          ref={ref}
          src={assetUrl(image.url)}
          alt={image.alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailedUrl(image.url)}
        />
      ) : (
        <span className="image-fallback" role="img" aria-label={image.alt}>
          {image.alt}
          <small>图片暂时无法加载</small>
        </span>
      )}
    </div>
  );
}

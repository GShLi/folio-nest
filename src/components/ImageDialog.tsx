import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import type { ImageAsset } from '../content/schema';
import { assetUrl } from '../content/load';

export function ImageDialog({ image, onClose }: { image: ImageAsset | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!image || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [image]);
  return (
    <dialog
      ref={ref}
      className="image-dialog"
      aria-label={image?.alt ?? '项目大图'}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <button className="dialog-close" onClick={onClose} aria-label="关闭大图" autoFocus>
        <X size={26} />
      </button>
      {image && (
        <>
          <img src={assetUrl(image.url)} alt={image.alt} />
          <p>{image.alt}</p>
        </>
      )}
    </dialog>
  );
}

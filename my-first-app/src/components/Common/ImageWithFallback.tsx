import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

type ImageWithFallbackProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackClassName?: string;
};

const ImageWithFallback = ({ src, alt = '', className = '', fallbackClassName, onError, ...props }: ImageWithFallbackProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  if (!src || failedSrc === src) {
    const accessibleLabel = alt ? `Không tải được ảnh: ${alt}` : 'Không có ảnh';

    return (
      <div
        role="img"
        aria-label={accessibleLabel}
        className={`flex items-center justify-center gap-2 overflow-hidden bg-slate-900 text-slate-500 ${fallbackClassName ?? className}`}
      >
        <ImageOff aria-hidden="true" className="h-6 w-6 shrink-0" />
        <span className="sr-only">{accessibleLabel}</span>
      </div>
    );
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        setFailedSrc(src);
        onError?.(event);
      }}
    />
  );
};

export default ImageWithFallback;

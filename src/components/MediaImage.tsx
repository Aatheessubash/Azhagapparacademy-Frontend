import React, { useState } from 'react';

import { resolveMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallback?: React.ReactNode;
};

const MediaImage: React.FC<Props> = ({ src, fallback = null, className, onError, ...props }) => {
  // Track failures per resolved URL so changing `src` automatically resets error state.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);

  const resolvedSrc = src ? resolveMediaUrl(src) : '';

  const hasError = Boolean(resolvedSrc && erroredSrc === resolvedSrc);

  if (!resolvedSrc || hasError) {
    return <>{fallback}</>;
  }

  return (
    <img
      {...props}
      src={resolvedSrc}
      className={cn(className)}
      onError={(event) => {
        setErroredSrc(resolvedSrc);
        onError?.(event);
      }}
    />
  );
};

export default MediaImage;

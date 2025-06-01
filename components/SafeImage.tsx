"use client";

import { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * SafeImage component that handles broken images by providing a fallback
 * Particularly useful for external images like Twitter profile pictures
 */
export default function SafeImage({
  src,
  alt,
  fallbackSrc = "/default-avatar.png",
  width = 40,
  height = 40,
  className = ""
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Handle image load error
  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";


interface MediaImageProps {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
}


export function MediaImage({ src, alt, sizes, className }: MediaImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className={`media-image-fallback ${className ?? ""}`} aria-label={alt} />;
  }
  const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "");
  const optimized = src.startsWith("/") || Boolean(mediaBase && src.startsWith(`${mediaBase}/`));
  if (!optimized) {
    // Legacy external URLs remain readable without opening Next.js to arbitrary hosts.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
  }
  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}

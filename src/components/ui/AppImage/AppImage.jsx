"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK = "/park.jpeg";

/**
 * Обёртка над next/image с автоматическим фолбеком при ошибке загрузки.
 * Принимает все пропсы next/image.
 */
export default function AppImage({ src, fallback = FALLBACK, alt = "", ...props }) {
  const [imgSrc, setImgSrc] = useState(src || fallback);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallback)}
    />
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function HeadLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // Disappear after 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900 transition-opacity duration-500">
      <div className="relative w-32 h-32">
        <Image
          src="/v1-logo.png"
          alt="Loading"
          fill
          className="object-contain animate-pulse"
          priority
        />
      </div>
    </div>
  );
} 
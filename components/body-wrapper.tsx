'use client';

import { useEffect, useState } from 'react';

interface BodyWrapperProps {
  children: React.ReactNode;
  className: string;
}

export function BodyWrapper({ children, className }: BodyWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <body className={className} suppressHydrationWarning={true}>
        {children}
      </body>
    );
  }

  return (
    <body className={className}>
      {children}
    </body>
  );
}

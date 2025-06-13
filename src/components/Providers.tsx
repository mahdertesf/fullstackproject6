// src/components/Providers.tsx
'use client';

import React, { useEffect, useState } from 'react';

// This component is useful if you need to ensure client-side stores are initialized correctly,
// especially if they interact with localStorage or other browser APIs.
// For Zustand, direct usage is often fine, but a provider pattern can help with SSR consistency.

export default function Providers({ children }: { children: React.ReactNode }) {
  // Ensures that client-side only logic runs after mounting
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // You can return a loading state or null here if needed before client-side hydration
    return null; 
  }

  return <>{children}</>;
}

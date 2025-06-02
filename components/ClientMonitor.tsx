'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the RequestMonitor component
const RequestMonitor = dynamic(() => import('./RequestMonitor'), {
  ssr: false,
});

/**
 * Client-side wrapper for the RequestMonitor component
 * This ensures it only renders on the client and only in development mode
 */
export default function ClientMonitor() {
  const [isDev, setIsDev] = useState(false);
  
  useEffect(() => {
    // Check if we're in development mode
    setIsDev(process.env.NODE_ENV !== 'production');
  }, []);
  
  // Only render in development mode and on client-side
  if (!isDev) return null;
  
  return <RequestMonitor />;
}

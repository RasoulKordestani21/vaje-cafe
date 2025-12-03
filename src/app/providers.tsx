'use client';

import React from 'react';
import { MenuProvider } from '../context/MenuContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <MenuProvider>{children}</MenuProvider>;
}
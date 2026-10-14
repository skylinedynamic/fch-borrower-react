import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { PrimeReactProvider } from 'primereact/api'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from './lib/query'

// Every provider the app renders under, in one place so tests can mount the
// same tree main.jsx does.
//
// PrimeReactProvider: PrimeReact's popups (Dropdown, MultiSelect, Menu, ...)
// read their settings from its context on scroll/resize, some with no null
// check - without it an open dropdown throws as soon as the page scrolls.
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>{children}</PrimeReactProvider>
    </QueryClientProvider>
  </BrowserRouter>
)

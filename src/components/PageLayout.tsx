import type { ReactNode } from 'react';
import { Header } from './Header';

interface PageLayoutProps {
  children: ReactNode;
  /** Rendered as the page `<h1>`. Omit to supply a custom heading in `children`. */
  title?: string;
}

/**
 * The shell every signed-in page shares: a skip link, the header, and a
 * focusable `<main id="main">` landmark (the target for the skip link and for
 * the on-route-change focus move).
 */
export function PageLayout({ children, title }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main"
        className="sr-only rounded bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="p-8 outline-none">
        {title !== undefined && <h1 className="text-xl font-semibold text-slate-900">{title}</h1>}
        {children}
      </main>
    </div>
  );
}

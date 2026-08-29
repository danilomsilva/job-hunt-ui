import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * On every route change after the first, move focus to the `<main id="main">`
 * landmark so keyboard and screen-reader users land on the new page's content
 * instead of wherever the activated link left them.
 */
export function useRouteFocus(): void {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    document.getElementById('main')?.focus();
  }, [pathname]);
}

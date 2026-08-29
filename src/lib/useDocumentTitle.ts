import { useEffect } from 'react';

/** Sets `document.title` to `"<title> — job-hunt"` while the caller is mounted. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} — job-hunt`;
  }, [title]);
}

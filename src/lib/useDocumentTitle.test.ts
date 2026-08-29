import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  it('sets the document title and updates it when the value changes', () => {
    const { rerender } = renderHook(
      ({ title }) => {
        useDocumentTitle(title);
      },
      { initialProps: { title: 'Applications' } },
    );

    expect(document.title).toBe('Applications — job-hunt');

    rerender({ title: 'New application' });
    expect(document.title).toBe('New application — job-hunt');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useRouteFocus } from './useRouteFocus';

function Page({ label, to }: { label: string; to: string }) {
  return (
    <main id="main" tabIndex={-1}>
      <h1>{label}</h1>
      <Link to={to}>go</Link>
    </main>
  );
}

function Harness() {
  useRouteFocus();
  return (
    <Routes>
      <Route path="/a" element={<Page label="A" to="/b" />} />
      <Route path="/b" element={<Page label="B" to="/a" />} />
    </Routes>
  );
}

describe('useRouteFocus', () => {
  it('leaves focus alone on first render, then focuses #main after navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/a']}>
        <Harness />
      </MemoryRouter>,
    );

    expect(document.body).toHaveFocus();

    await userEvent.click(screen.getByRole('link', { name: 'go' }));

    expect(await screen.findByRole('heading', { name: 'B' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });
});

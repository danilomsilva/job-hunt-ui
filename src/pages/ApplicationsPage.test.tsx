import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { saveSession } from '../lib/tokens';
import { server } from '../mocks/server';
import { ApplicationsPage } from './ApplicationsPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function seedSession() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ada@example.com', password: 'password123' }),
  });
  const { refreshToken } = (await res.json()) as { refreshToken: string };
  saveSession({ refreshToken, email: 'ada@example.com' });
}

function emptyList() {
  return HttpResponse.json({
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  });
}

function renderPage(initialEntry = '/applications') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <ApplicationsPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ApplicationsPage', () => {
  it('renders a row per application', async () => {
    await seedSession();
    renderPage();

    expect(await screen.findByText('Globex')).toBeInTheDocument();
    expect(screen.getByText('Initech')).toBeInTheDocument();
    // header row + one per seeded application
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('links to the new-application page and to each row detail', async () => {
    await seedSession();
    renderPage();

    await screen.findByText('Globex');
    expect(screen.getByRole('link', { name: 'New application' })).toHaveAttribute(
      'href',
      '/applications/new',
    );
    expect(screen.getByRole('link', { name: 'Globex' }).getAttribute('href')).toMatch(
      /^\/applications\/[0-9a-f-]+$/,
    );
  });

  it('shows a first-run empty state with a call to action', async () => {
    await seedSession();
    server.use(http.get(`${API_URL}/applications`, () => emptyList()));

    renderPage();

    expect(await screen.findByText('No applications yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add your first application' })).toHaveAttribute(
      'href',
      '/applications/new',
    );
  });

  it('shows an error with a working retry', async () => {
    await seedSession();
    let calls = 0;
    server.use(
      http.get(`${API_URL}/applications`, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error' }, requestId: 't' },
              { status: 500 },
            )
          : emptyList();
      }),
    );

    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No applications yet.')).toBeInTheDocument();
  });

  it('narrows the rows from a status param in the URL', async () => {
    await seedSession();
    renderPage('/applications?status=interview');

    expect(await screen.findByText('Globex')).toBeInTheDocument();
    expect(screen.queryByText('Initech')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2); // header + one match
  });

  it('shows the narrowed empty copy (no CTA) when a filter matches nothing', async () => {
    await seedSession();
    renderPage('/applications?company=nomatchxyz');

    expect(await screen.findByText('No applications match this view.')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Add your first application' }),
    ).not.toBeInTheDocument();
  });

  it('shows the narrowed empty copy — not the first-run CTA — on an out-of-range page', async () => {
    await seedSession();
    // 4 seeded rows, pageSize 2 → page 3 is out of range and comes back empty
    renderPage('/applications?pageSize=2&page=3');

    expect(await screen.findByText('No applications match this view.')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Add your first application' }),
    ).not.toBeInTheDocument();
    // the pager is still there so the user can get back
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('pages through the list', async () => {
    await seedSession();
    renderPage('/applications?pageSize=2&sortBy=company&sortOrder=asc');

    expect(await screen.findByText('Globex')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.queryByText('Umbrella')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Umbrella')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });
});

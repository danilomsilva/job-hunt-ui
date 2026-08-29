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

function renderPage() {
  return render(
    <MemoryRouter>
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

  it('shows an empty state when there are none', async () => {
    await seedSession();
    server.use(http.get(`${API_URL}/applications`, () => emptyList()));

    renderPage();

    expect(await screen.findByText('No applications yet.')).toBeInTheDocument();
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
});

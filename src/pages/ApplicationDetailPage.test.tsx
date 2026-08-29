import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { saveSession, setAccessToken } from '../lib/tokens';
import { ApplicationDetailPage } from './ApplicationDetailPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function authenticate(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ada@example.com', password: 'password123' }),
  });
  const { accessToken, refreshToken } = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  saveSession({ refreshToken, email: 'ada@example.com' });
  setAccessToken(accessToken);
  return accessToken;
}

async function firstApplication(token: string): Promise<{ id: string; company: string }> {
  const res = await fetch(`${API_URL}/applications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await res.json()) as { data: { id: string; company: string }[] };
  const first = body.data[0];
  if (!first) throw new Error('expected seeded applications');
  return first;
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/applications" element={<p>list page</p>} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/applications/:id/edit" element={<p>edit page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ApplicationDetailPage', () => {
  it('renders the application fields', async () => {
    const token = await authenticate();
    const { id, company } = await firstApplication(token);

    renderAt(`/applications/${id}`);

    expect(await screen.findByRole('heading', { name: company })).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      `/applications/${id}/edit`,
    );
  });

  it('shows a not-found message for an unknown id', async () => {
    await authenticate();
    renderAt('/applications/00000000-0000-0000-0000-000000000000');

    expect(await screen.findByText(/doesn’t exist/)).toBeInTheDocument();
  });

  it('deletes after an inline confirm and returns to the list', async () => {
    const token = await authenticate();
    const { id } = await firstApplication(token);

    renderAt(`/applications/${id}`);
    await screen.findByRole('heading', { level: 2 });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('list page')).toBeInTheDocument();

    const gone = await fetch(`${API_URL}/applications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(gone.status).toBe(404);
  });

  it('cancels the delete confirmation', async () => {
    const token = await authenticate();
    const { id } = await firstApplication(token);

    renderAt(`/applications/${id}`);
    await screen.findByRole('heading', { level: 2 });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
    expect(screen.queryByText('list page')).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { saveSession, setAccessToken } from '../lib/tokens';
import { EditApplicationPage, NewApplicationPage } from './ApplicationFormPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function DetailProbe() {
  const { id } = useParams();
  return <p>detail {id}</p>;
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/applications" element={<p>list</p>} />
          <Route path="/applications/new" element={<NewApplicationPage />} />
          <Route path="/applications/:id" element={<DetailProbe />} />
          <Route path="/applications/:id/edit" element={<EditApplicationPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

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

describe('NewApplicationPage', () => {
  it('creates an application and navigates to its detail page', async () => {
    await authenticate();
    renderAt('/applications/new');

    await userEvent.type(screen.getByLabelText('Company'), 'Umbra Corp');
    await userEvent.type(screen.getByLabelText('Role'), 'Analyst');
    await userEvent.click(screen.getByRole('button', { name: 'Create application' }));

    expect(await screen.findByText(/^detail /)).toBeInTheDocument();
  });
});

describe('EditApplicationPage', () => {
  it('prefills the form and saves changes back to the detail page', async () => {
    const token = await authenticate();
    const { id, company } = await firstApplication(token);

    renderAt(`/applications/${id}/edit`);

    const companyInput = await screen.findByLabelText('Company');
    expect(companyInput).toHaveValue(company);

    await userEvent.clear(screen.getByLabelText('Role'));
    await userEvent.type(screen.getByLabelText('Role'), 'Principal Engineer');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(`detail ${id}`)).toBeInTheDocument();
  });

  it('shows a not-found message for an unknown id', async () => {
    await authenticate();
    renderAt('/applications/00000000-0000-0000-0000-000000000000/edit');

    expect(await screen.findByText(/doesn’t exist/)).toBeInTheDocument();
  });
});

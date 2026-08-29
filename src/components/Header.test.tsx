import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { loadSession, saveSession } from '../lib/tokens';
import { Header } from './Header';

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

describe('Header', () => {
  it('shows the signed-in email and logs out to /login', async () => {
    await seedSession();

    render(
      <MemoryRouter initialEntries={['/applications']}>
        <AuthProvider>
          <Routes>
            <Route path="/applications" element={<Header />} />
            <Route path="/login" element={<p>login page</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('ada@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(loadSession()).toBeNull();
  });
});

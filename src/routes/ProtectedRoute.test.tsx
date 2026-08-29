import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { saveSession } from '../lib/tokens';
import { ProtectedRoute } from './ProtectedRoute';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute>
                <p>secret page</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when there is no session', async () => {
    renderAt('/secret');
    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret page')).not.toBeInTheDocument();
  });

  it('renders the route once the stored session restores', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'password123' }),
    });
    const { refreshToken } = (await res.json()) as { refreshToken: string };
    saveSession({ refreshToken, email: 'ada@example.com' });

    renderAt('/secret');
    expect(await screen.findByText('secret page')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { loadSession, saveSession } from '../lib/tokens';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

function Harness() {
  const { user, status, login, register, logout } = useAuth();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="email">{user?.email ?? 'none'}</p>
      <button onClick={() => void login({ email: 'ada@example.com', password: 'password123' })}>
        log in
      </button>
      <button onClick={() => void register({ email: 'new@example.com', password: 'password123' })}>
        register
      </button>
      <button onClick={() => void logout()}>log out</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  it('settles on unauthenticated when there is no stored session', async () => {
    renderHarness();
    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
  });

  it('logs in, exposes the user, and persists the session', async () => {
    renderHarness();
    await screen.findByText('unauthenticated');

    await userEvent.click(screen.getByRole('button', { name: 'log in' }));

    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toHaveTextContent('ada@example.com');
    expect(loadSession()).toMatchObject({ email: 'ada@example.com' });
  });

  it('restores a session on mount from a stored refresh token', async () => {
    // Log in once to mint a real refresh token, then simulate a fresh page load.
    const login = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ada@example.com', password: 'password123' }),
      },
    );
    const { refreshToken } = (await login.json()) as { refreshToken: string };
    saveSession({ refreshToken, email: 'ada@example.com' });

    renderHarness();

    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toHaveTextContent('ada@example.com');
  });

  it('logs out and clears the stored session', async () => {
    renderHarness();
    await screen.findByText('unauthenticated');
    await userEvent.click(screen.getByRole('button', { name: 'log in' }));
    await screen.findByText('authenticated');

    await userEvent.click(screen.getByRole('button', { name: 'log out' }));

    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
    expect(loadSession()).toBeNull();
  });

  it('registers then logs in with the same credentials', async () => {
    renderHarness();
    await screen.findByText('unauthenticated');

    await userEvent.click(screen.getByRole('button', { name: 'register' }));

    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toHaveTextContent('new@example.com');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { saveSession } from '../lib/tokens';
import { LoginPage } from './LoginPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<p>register page</p>} />
          <Route path="/applications" element={<p>applications page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('validates the fields before calling the API', async () => {
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.queryByText('applications page')).not.toBeInTheDocument();
  });

  it('surfaces an invalid-credentials error from the API', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.queryByText('applications page')).not.toBeInTheDocument();
  });

  it('redirects to the app on a successful login', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('applications page')).toBeInTheDocument();
  });

  it('bounces straight to the app when already signed in', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'password123' }),
    });
    const { refreshToken } = (await res.json()) as { refreshToken: string };
    saveSession({ refreshToken, email: 'ada@example.com' });

    renderLogin();

    expect(await screen.findByText('applications page')).toBeInTheDocument();
  });
});

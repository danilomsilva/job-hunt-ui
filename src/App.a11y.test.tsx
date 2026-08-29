import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from './auth/AuthProvider';
import { saveSession, setAccessToken } from './lib/tokens';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { NewApplicationPage } from './pages/ApplicationFormPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function authenticate() {
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
}

function renderPage(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('accessibility (axe)', () => {
  it('login page', async () => {
    const { container } = renderPage(<LoginPage />);
    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('register page', async () => {
    const { container } = renderPage(<RegisterPage />);
    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('applications list', async () => {
    await authenticate();
    const { container, findByRole } = renderPage(<ApplicationsPage />);
    await findByRole('link', { name: 'Globex' });
    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('new application form', async () => {
    await authenticate();
    const { container, findByLabelText } = renderPage(<NewApplicationPage />);
    await findByLabelText('Company');
    expect(await axe.run(container)).toHaveNoViolations();
  });
});

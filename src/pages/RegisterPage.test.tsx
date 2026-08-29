import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { RegisterPage } from './RegisterPage';

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/applications" element={<p>applications page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  it('validates the fields before calling the API', async () => {
    renderRegister();

    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('shows the conflict message when the email is already taken', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists',
    );
    expect(screen.queryByText('applications page')).not.toBeInTheDocument();
  });

  it('creates a new account and lands in the app', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText('Email'), 'grace@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'hopper1906');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('applications page')).toBeInTheDocument();
  });
});

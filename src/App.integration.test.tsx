import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('applications flow', () => {
  // A long sequence of real interactions — give it room under a loaded CI run.
  it('logs in, then creates, edits, and deletes an application', { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    renderApp();

    // sign in
    await user.type(await screen.findByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // land on the list
    expect(await screen.findByRole('heading', { name: 'Applications' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Globex' })).toBeInTheDocument();

    // create a new application
    await user.click(screen.getByRole('link', { name: 'New application' }));
    await user.type(await screen.findByLabelText('Company'), 'Testflight Ltd');
    await user.type(screen.getByLabelText('Role'), 'QA Lead');
    await user.click(screen.getByRole('button', { name: 'Create application' }));

    // its detail page
    expect(await screen.findByRole('heading', { name: 'Testflight Ltd' })).toBeInTheDocument();

    // it now shows in the list
    await user.click(screen.getByRole('link', { name: 'Back to applications' }));
    expect(await screen.findByRole('link', { name: 'Testflight Ltd' })).toBeInTheDocument();

    // edit it
    await user.click(screen.getByRole('link', { name: 'Testflight Ltd' }));
    await user.click(await screen.findByRole('link', { name: 'Edit' }));
    const role = await screen.findByLabelText('Role');
    await user.clear(role);
    await user.type(role, 'QA Manager');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('QA Manager')).toBeInTheDocument();

    // delete it
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByRole('heading', { name: 'Applications' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Testflight Ltd' })).not.toBeInTheDocument();
  });
});

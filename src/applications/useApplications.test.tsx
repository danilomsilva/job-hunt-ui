import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { setAccessToken } from '../lib/tokens';
import type { Application } from '../lib/types';
import { server } from '../mocks/server';
import { useApplications } from './useApplications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function authenticate() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ada@example.com', password: 'password123' }),
  });
  const { accessToken } = (await res.json()) as { accessToken: string };
  setAccessToken(accessToken);
}

function serverError() {
  return HttpResponse.json(
    { error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom' }, requestId: 'test' },
    { status: 500 },
  );
}

const oneRow: Application = {
  id: 'a1',
  userId: 'u1',
  company: 'Recovered',
  role: 'Engineer',
  status: 'applied',
  location: null,
  jobUrl: null,
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: null,
  notes: null,
  appliedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function Harness() {
  const { applications, status, error, reload } = useApplications();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="error">{error ?? 'none'}</p>
      <ul>
        {applications.map((application) => (
          <li key={application.id}>{application.company}</li>
        ))}
      </ul>
      <button onClick={reload}>reload</button>
    </div>
  );
}

describe('useApplications', () => {
  it('starts loading, then exposes the fetched list', async () => {
    await authenticate();
    render(<Harness />);

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    expect(await screen.findByText('Globex')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('success');
  });

  it('surfaces the error message when the request fails', async () => {
    await authenticate();
    server.use(http.get(`${API_URL}/applications`, () => serverError()));

    render(<Harness />);

    expect(await screen.findByText('boom')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('error');
  });

  it('refetches on reload', async () => {
    await authenticate();
    let calls = 0;
    server.use(
      http.get(`${API_URL}/applications`, () => {
        calls += 1;
        return calls === 1
          ? serverError()
          : HttpResponse.json({
              data: [oneRow],
              pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
            });
      }),
    );

    render(<Harness />);
    expect(await screen.findByText('boom')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'reload' }));

    expect(await screen.findByText('Recovered')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('success');
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { setAccessToken } from '../lib/tokens';
import type { Application } from '../lib/types';
import { server } from '../mocks/server';
import { useApplication } from './useApplication';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

async function authenticate(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ada@example.com', password: 'password123' }),
  });
  const { accessToken } = (await res.json()) as { accessToken: string };
  setAccessToken(accessToken);
  return accessToken;
}

async function seededApplications(accessToken: string): Promise<{ id: string; company: string }[]> {
  const res = await fetch(`${API_URL}/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return ((await res.json()) as { data: { id: string; company: string }[] }).data;
}

async function firstApplicationId(accessToken: string): Promise<string> {
  const first = (await seededApplications(accessToken))[0];
  if (!first) throw new Error('expected seeded applications');
  return first.id;
}

function Harness({ id }: { id: string }) {
  const { application, status, error, reload } = useApplication(id);
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="error">{error ?? 'none'}</p>
      <p data-testid="company">{application?.company ?? 'none'}</p>
      <button onClick={reload}>reload</button>
    </div>
  );
}

describe('useApplication', () => {
  it('loads an application by id', async () => {
    const token = await authenticate();
    const id = await firstApplicationId(token);

    render(<Harness id={id} />);
    expect(screen.getByTestId('status')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('success');
    });
    expect(screen.getByTestId('company')).not.toHaveTextContent('none');
  });

  it('reports notFound for an unknown id', async () => {
    await authenticate();

    render(<Harness id={UNKNOWN_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('notFound');
    });
  });

  it('recovers on reload', async () => {
    const token = await authenticate();
    const id = await firstApplicationId(token);

    const reloaded: Application = {
      id,
      userId: 'u1',
      company: 'Reloaded',
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
    let calls = 0;
    server.use(
      http.get(`${API_URL}/applications/:id`, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom' }, requestId: 't' },
              { status: 500 },
            )
          : HttpResponse.json(reloaded);
      }),
    );

    render(<Harness id={id} />);
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error');
    });

    await userEvent.click(screen.getByRole('button', { name: 'reload' }));

    await waitFor(() => {
      expect(screen.getByTestId('company')).toHaveTextContent('Reloaded');
    });
  });

  it('drops the previous application immediately when the id changes', async () => {
    const token = await authenticate();
    const [a, b] = await seededApplications(token);
    if (!a || !b) throw new Error('expected at least two seeded applications');

    const { rerender } = render(<Harness id={a.id} />);
    await waitFor(() => {
      expect(screen.getByTestId('company')).toHaveTextContent(a.company);
    });

    rerender(<Harness id={b.id} />);

    // no stale data from `a` while `b` is in flight
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    expect(screen.getByTestId('company')).toHaveTextContent('none');

    await waitFor(() => {
      expect(screen.getByTestId('company')).toHaveTextContent(b.company);
    });
  });
});

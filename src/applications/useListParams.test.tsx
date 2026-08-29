import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useListParams } from './useListParams';

function Probe() {
  const { params, setFilter, setPage } = useListParams();
  const [search] = useSearchParams();
  return (
    <div>
      <p data-testid="params">{JSON.stringify(params)}</p>
      <p data-testid="search">{search.toString()}</p>
      <button
        onClick={() => {
          setFilter({ status: 'interview' });
        }}
      >
        filter
      </button>
      <button
        onClick={() => {
          setPage(1);
        }}
      >
        page 1
      </button>
    </div>
  );
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Probe />
    </MemoryRouter>,
  );
}

function readParams(): Record<string, unknown> {
  return JSON.parse(screen.getByTestId('params').textContent) as Record<string, unknown>;
}

describe('useListParams', () => {
  it('parses the known params and ignores anything else', () => {
    renderAt(
      '/applications?status=interview&company=acme&sortBy=company&sortOrder=asc&page=2&bogus=x',
    );
    expect(readParams()).toEqual({
      status: 'interview',
      company: 'acme',
      sortBy: 'company',
      sortOrder: 'asc',
      page: 2,
    });
  });

  it('drops an invalid status and a non-positive page', () => {
    renderAt('/applications?status=notreal&page=-1');
    const params = readParams();
    expect(params.status).toBeUndefined();
    expect(params.page).toBeUndefined();
  });

  it('setFilter adds the value and resets to page 1', async () => {
    renderAt('/applications?page=4');

    await userEvent.click(screen.getByRole('button', { name: 'filter' }));

    expect(screen.getByTestId('search')).toHaveTextContent('status=interview');
    expect(screen.getByTestId('search')).not.toHaveTextContent('page');
  });

  it('setPage(1) removes the page param', async () => {
    renderAt('/applications?status=offer&page=3');

    await userEvent.click(screen.getByRole('button', { name: 'page 1' }));

    expect(screen.getByTestId('search')).toHaveTextContent('status=offer');
    expect(screen.getByTestId('search')).not.toHaveTextContent('page');
  });
});

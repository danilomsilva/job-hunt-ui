import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListControls } from './ListControls';

describe('ListControls', () => {
  it('reports a status selection', async () => {
    const onFilter = vi.fn();
    render(<ListControls params={{}} onFilter={onFilter} />);

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'interview');

    expect(onFilter).toHaveBeenCalledWith({ status: 'interview' });
  });

  it('clears the status filter when "All statuses" is chosen', async () => {
    const onFilter = vi.fn();
    render(<ListControls params={{ status: 'interview' }} onFilter={onFilter} />);

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'All statuses');

    expect(onFilter).toHaveBeenCalledWith({ status: undefined });
  });

  it('reports a sort field and toggles the order', async () => {
    const onFilter = vi.fn();
    render(<ListControls params={{ sortBy: 'company', sortOrder: 'asc' }} onFilter={onFilter} />);

    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'appliedAt');
    expect(onFilter).toHaveBeenCalledWith({ sortBy: 'appliedAt' });

    await userEvent.click(screen.getByRole('button', { name: /ascending/i }));
    expect(onFilter).toHaveBeenCalledWith({ sortOrder: 'desc' });
  });

  it('pushes the company filter after a debounce pause', async () => {
    const onFilter = vi.fn();
    render(<ListControls params={{}} onFilter={onFilter} />);

    await userEvent.type(screen.getByLabelText('Company'), 'globex');

    await waitFor(
      () => {
        expect(onFilter).toHaveBeenCalledWith({ company: 'globex' });
      },
      { timeout: 1000 },
    );
  });
});

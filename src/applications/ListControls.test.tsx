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

  it('adopts a company value that changed in the URL and does not push it back', async () => {
    const onFilter = vi.fn();
    const { rerender } = render(
      <ListControls params={{ company: 'globex' }} onFilter={onFilter} />,
    );
    expect(screen.getByLabelText('Company')).toHaveValue('globex');

    // e.g. the Back button drops the company filter from the URL
    rerender(<ListControls params={{}} onFilter={onFilter} />);

    expect(screen.getByLabelText('Company')).toHaveValue('');
    // give the debounce a chance to (wrongly) re-push the stale value
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(onFilter).not.toHaveBeenCalledWith({ company: 'globex' });
  });
});

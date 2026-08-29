import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Pagination as PaginationInfo } from '../lib/types';
import { Pagination } from './Pagination';

function info(overrides: Partial<PaginationInfo>): PaginationInfo {
  return { page: 1, pageSize: 20, total: 40, totalPages: 2, ...overrides };
}

describe('Pagination', () => {
  it('renders nothing when there is a single page', () => {
    const { container } = render(
      <Pagination pagination={info({ total: 3, totalPages: 1 })} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without pagination data', () => {
    const { container } = render(<Pagination pagination={null} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables Previous on the first page and advances with Next', async () => {
    const onPageChange = vi.fn();
    render(<Pagination pagination={info({ page: 1 })} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables Next on the last page and steps back with Previous', async () => {
    const onPageChange = vi.fn();
    render(<Pagination pagination={info({ page: 2 })} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

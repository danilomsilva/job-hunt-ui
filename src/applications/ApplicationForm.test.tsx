import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationForm } from './ApplicationForm';
import type { ApplicationPayload } from './applicationsApi';
import { emptyForm, type ApplicationFormValues } from './schemas';

const filled: ApplicationFormValues = {
  ...emptyForm,
  company: 'Acme',
  role: 'Engineer',
  status: 'applied',
  // Blank so the "blank optionals become null" assertion still covers currency,
  // even though a fresh form defaults it to EUR.
  salaryCurrency: '',
};

function renderForm(overrides: {
  initialValues?: ApplicationFormValues;
  onSubmit?: (payload: ApplicationPayload) => Promise<void>;
  onCancel?: () => void;
}) {
  const onSubmit = overrides.onSubmit ?? vi.fn<(payload: ApplicationPayload) => Promise<void>>();
  const onCancel = overrides.onCancel ?? vi.fn();
  render(
    <ApplicationForm
      initialValues={overrides.initialValues ?? emptyForm}
      submitLabel="Save"
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return { onSubmit, onCancel };
}

describe('ApplicationForm', () => {
  it('blocks submit and shows errors when required fields are empty', async () => {
    const { onSubmit } = renderForm({});

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Company is required')).toBeInTheDocument();
    expect(screen.getByText('Role is required')).toBeInTheDocument();
    // the message is wired to the input for assistive tech
    expect(screen.getByLabelText('Company')).toHaveAccessibleDescription('Company is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('defaults the currency to EUR', () => {
    renderForm({});
    expect(screen.getByLabelText('Currency')).toHaveValue('EUR');
  });

  it('flags a salary minimum above the maximum', async () => {
    const { onSubmit } = renderForm({ initialValues: { ...filled } });

    await userEvent.type(screen.getByLabelText('Salary min'), '200000');
    await userEvent.type(screen.getByLabelText('Salary max'), '100000');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Minimum must not exceed maximum')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a malformed job URL', async () => {
    const { onSubmit } = renderForm({ initialValues: { ...filled } });

    await userEvent.type(screen.getByLabelText('Job URL'), 'not a url');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Enter a valid http(s) URL')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a non-http(s) URL scheme', async () => {
    const { onSubmit } = renderForm({ initialValues: { ...filled } });

    await userEvent.type(screen.getByLabelText('Job URL'), 'javascript:alert(1)');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Enter a valid http(s) URL')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a typed payload with nulls for the blank optionals', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ initialValues: { ...filled }, onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        company: 'Acme',
        role: 'Engineer',
        status: 'applied',
        location: null,
        jobUrl: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        notes: null,
        appliedAt: null,
      });
    });
  });

  it('calls onCancel', async () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});

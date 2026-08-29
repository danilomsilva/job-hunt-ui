import { useState } from 'react';
import { z } from 'zod';
import { ApiError } from '../lib/api';
import type { ApplicationPayload } from './applicationsApi';
import { STATUS_LABELS } from './formatStatus';
import { applicationFormSchema, type ApplicationFormValues } from './schemas';

type FieldErrors = Partial<Record<keyof ApplicationFormValues, string>>;

interface ApplicationFormProps {
  initialValues: ApplicationFormValues;
  submitLabel: string;
  onSubmit: (payload: ApplicationPayload) => Promise<void>;
  onCancel: () => void;
}

const inputClass = 'rounded border border-slate-300 px-2 py-1 text-sm';

interface FieldProps {
  id: keyof ApplicationFormValues;
  label: string;
  value: string;
  error?: string | undefined;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function Field({ id, label, value, error, type = 'text', placeholder, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-600">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={error !== undefined}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={inputClass}
      />
      {error !== undefined && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ApplicationForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ApplicationFormProps) {
  const [values, setValues] = useState<ApplicationFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function setField(key: keyof ApplicationFormValues, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(): Promise<void> {
    setFormError(null);

    const parsed = applicationFormSchema.safeParse(values);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      const next: FieldErrors = {};
      for (const [key, messages] of Object.entries(flat.fieldErrors)) {
        const first = messages[0];
        if (first !== undefined) next[key as keyof ApplicationFormValues] = first;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});

    setPending(true);
    try {
      await onSubmit(parsed.data);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      className="mt-4 flex max-w-md flex-col gap-4"
    >
      {formError !== null && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <Field
        id="company"
        label="Company"
        value={values.company}
        error={fieldErrors.company}
        onChange={(value) => {
          setField('company', value);
        }}
      />
      <Field
        id="role"
        label="Role"
        value={values.role}
        error={fieldErrors.role}
        onChange={(value) => {
          setField('role', value);
        }}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-xs font-medium text-slate-600">
          Status
        </label>
        <select
          id="status"
          value={values.status}
          onChange={(event) => {
            setField('status', event.target.value);
          }}
          className={inputClass}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {fieldErrors.status !== undefined && (
          <p className="text-xs text-red-600">{fieldErrors.status}</p>
        )}
      </div>

      <Field
        id="location"
        label="Location"
        value={values.location}
        error={fieldErrors.location}
        onChange={(value) => {
          setField('location', value);
        }}
      />
      <Field
        id="jobUrl"
        label="Job URL"
        value={values.jobUrl}
        error={fieldErrors.jobUrl}
        placeholder="https://…"
        onChange={(value) => {
          setField('jobUrl', value);
        }}
      />
      <Field
        id="salaryMin"
        label="Salary min"
        type="number"
        value={values.salaryMin}
        error={fieldErrors.salaryMin}
        onChange={(value) => {
          setField('salaryMin', value);
        }}
      />
      <Field
        id="salaryMax"
        label="Salary max"
        type="number"
        value={values.salaryMax}
        error={fieldErrors.salaryMax}
        onChange={(value) => {
          setField('salaryMax', value);
        }}
      />
      <Field
        id="salaryCurrency"
        label="Currency"
        placeholder="USD"
        value={values.salaryCurrency}
        error={fieldErrors.salaryCurrency}
        onChange={(value) => {
          setField('salaryCurrency', value);
        }}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-xs font-medium text-slate-600">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={values.notes}
          onChange={(event) => {
            setField('notes', event.target.value);
          }}
          className={inputClass}
        />
      </div>

      <Field
        id="appliedAt"
        label="Applied date"
        type="date"
        value={values.appliedAt}
        error={fieldErrors.appliedAt}
        onChange={(value) => {
          setField('appliedAt', value);
        }}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

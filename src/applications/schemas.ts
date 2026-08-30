import { z } from 'zod';
import type { Application } from '../lib/types';

/** The raw form state — every field a string, the way controlled inputs give it. */
export interface ApplicationFormValues {
  company: string;
  role: string;
  status: string;
  location: string;
  jobUrl: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  notes: string;
  appliedAt: string;
}

export const emptyForm: ApplicationFormValues = {
  company: '',
  role: '',
  status: 'wishlist',
  location: '',
  jobUrl: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'EUR',
  notes: '',
  appliedAt: '',
};

/** Edit prefill — an existing application back into form strings. */
export function formFromApplication(application: Application): ApplicationFormValues {
  return {
    company: application.company,
    role: application.role,
    status: application.status,
    location: application.location ?? '',
    jobUrl: application.jobUrl ?? '',
    salaryMin: application.salaryMin === null ? '' : String(application.salaryMin),
    salaryMax: application.salaryMax === null ? '' : String(application.salaryMax),
    salaryCurrency: application.salaryCurrency ?? '',
    notes: application.notes ?? '',
    appliedAt: application.appliedAt === null ? '' : application.appliedAt.slice(0, 10),
  };
}

const STATUS_VALUES = [
  'wishlist',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'accepted',
] as const;

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

// The optional fields all arrive as strings and become `value | null`. Doing the
// parse/validate inside `.transform((raw, ctx) => …)` (rather than `.pipe`) keeps
// a blank field from ever reaching `Number('')` / URL parsing.
const optionalText = z.string().transform((raw) => {
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
});

const optionalInt = (label: string) =>
  z.string().transform((raw, ctx): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    if (!/^\d+$/.test(trimmed)) {
      ctx.addIssue({ code: 'custom', message: `${label} must be a whole number` });
      return z.NEVER;
    }
    return Number(trimmed);
  });

const optionalUrl = z.string().transform((raw, ctx): string | null => {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  // Restrict to http(s): `URL.canParse` also accepts javascript:/data:/etc.,
  // and this value is later rendered as a clickable link.
  let protocol: string | undefined;
  try {
    protocol = new URL(trimmed).protocol;
  } catch {
    protocol = undefined;
  }
  if (protocol !== 'http:' && protocol !== 'https:') {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid http(s) URL' });
    return z.NEVER;
  }
  return trimmed;
});

const optionalCurrency = z.string().transform((raw, ctx): string | null => {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed === '') return null;
  if (trimmed.length !== 3) {
    ctx.addIssue({ code: 'custom', message: 'Use a 3-letter code' });
    return z.NEVER;
  }
  return trimmed;
});

export const applicationFormSchema = z
  .object({
    company: requiredText('Company'),
    role: requiredText('Role'),
    status: z.enum(STATUS_VALUES),
    location: optionalText,
    jobUrl: optionalUrl,
    salaryMin: optionalInt('Salary min'),
    salaryMax: optionalInt('Salary max'),
    salaryCurrency: optionalCurrency,
    notes: optionalText,
    appliedAt: optionalText,
  })
  .superRefine((values, ctx) => {
    if (
      values.salaryMin !== null &&
      values.salaryMax !== null &&
      values.salaryMin > values.salaryMax
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Minimum must not exceed maximum',
        path: ['salaryMin'],
      });
    }
  });

export type ApplicationFormPayload = z.infer<typeof applicationFormSchema>;

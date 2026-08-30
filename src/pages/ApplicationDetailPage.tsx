import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteApplication } from '../applications/applicationsApi';
import { formatSalary, isSafeHttpUrl } from '../applications/formatApplication';
import { formatAppliedAt, STATUS_LABELS } from '../applications/formatStatus';
import { StatusBadge } from '../applications/StatusBadge';
import { useApplication } from '../applications/useApplication';
import { PageLayout } from '../components/PageLayout';
import { ApiError } from '../lib/api';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const backLink = (
  <Link to="/applications" className="mt-4 inline-block text-sm text-slate-600 underline">
    Back to applications
  </Link>
);

export function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id ?? '';
  const navigate = useNavigate();
  const { application, status, error, reload } = useApplication(id);
  useDocumentTitle(application?.company ?? 'Application');

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteApplication(id);
      void navigate('/applications', { replace: true });
    } catch (caught) {
      setDeleteError(
        caught instanceof ApiError ? caught.message : 'Could not delete this application.',
      );
      setDeleting(false);
    }
  }

  if (status === 'loading') {
    return (
      <PageLayout title="Application">
        <p role="status" className="mt-4 text-sm text-slate-500">
          Loading…
        </p>
      </PageLayout>
    );
  }

  if (status === 'notFound') {
    return (
      <PageLayout title="Application">
        <p className="mt-4 text-sm text-slate-500">That application doesn’t exist.</p>
        {backLink}
      </PageLayout>
    );
  }

  if (application === null) {
    return (
      <PageLayout title="Application">
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={reload}
          className="mt-2 rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700"
        >
          Try again
        </button>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Application">
      <div className="mt-4 max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{application.company}</h2>
            <p className="text-sm text-slate-600">{application.role}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">Status</dt>
          <dd className="text-slate-800">{STATUS_LABELS[application.status]}</dd>

          <dt className="text-slate-500">Location</dt>
          <dd className="text-slate-800">{application.location ?? '—'}</dd>

          <dt className="text-slate-500">Job URL</dt>
          <dd className="text-slate-800">
            {application.jobUrl === null ? (
              '—'
            ) : isSafeHttpUrl(application.jobUrl) ? (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-900 underline"
              >
                {application.jobUrl}
              </a>
            ) : (
              <span className="break-all">{application.jobUrl}</span>
            )}
          </dd>

          <dt className="text-slate-500">Salary</dt>
          <dd className="text-slate-800">
            {formatSalary(application.salaryMin, application.salaryMax, application.salaryCurrency)}
          </dd>

          <dt className="text-slate-500">Applied</dt>
          <dd className="text-slate-800">{formatAppliedAt(application.appliedAt)}</dd>

          <dt className="text-slate-500">Notes</dt>
          <dd className="whitespace-pre-wrap text-slate-800">{application.notes ?? '—'}</dd>

          <dt className="text-slate-500">Created</dt>
          <dd className="text-slate-800">{formatAppliedAt(application.createdAt)}</dd>

          <dt className="text-slate-500">Updated</dt>
          <dd className="text-slate-800">{formatAppliedAt(application.updatedAt)}</dd>
        </dl>

        {deleteError !== null && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3 text-sm">
          <Link
            to={`/applications/${application.id}/edit`}
            className="rounded border border-slate-300 px-3 py-1 font-medium text-slate-700"
          >
            Edit
          </Link>

          {confirming ? (
            <span className="flex items-center gap-2">
              Delete this application?
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  void handleDelete();
                }}
                className="rounded border border-red-300 px-3 py-1 font-medium text-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                }}
                className="rounded border border-slate-300 px-3 py-1 font-medium text-slate-700"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setConfirming(true);
              }}
              className="rounded border border-slate-300 px-3 py-1 font-medium text-slate-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {backLink}
    </PageLayout>
  );
}

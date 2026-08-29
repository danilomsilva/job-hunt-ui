import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApplicationForm } from '../applications/ApplicationForm';
import { createApplication, updateApplication } from '../applications/applicationsApi';
import { emptyForm, formFromApplication } from '../applications/schemas';
import { useApplication } from '../applications/useApplication';
import { Header } from '../components/Header';

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function NewApplicationPage() {
  const navigate = useNavigate();

  return (
    <Shell title="New application">
      <ApplicationForm
        initialValues={emptyForm}
        submitLabel="Create application"
        onSubmit={async (payload) => {
          const created = await createApplication(payload);
          void navigate(`/applications/${created.id}`, { replace: true });
        }}
        onCancel={() => {
          void navigate('/applications');
        }}
      />
    </Shell>
  );
}

export function EditApplicationPage() {
  const params = useParams();
  const id = params.id ?? '';
  const navigate = useNavigate();
  const { application, status } = useApplication(id);

  if (status === 'loading') {
    return (
      <Shell title="Edit application">
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      </Shell>
    );
  }

  if (status === 'notFound') {
    return (
      <Shell title="Edit application">
        <p className="mt-4 text-sm text-slate-500">That application doesn’t exist.</p>
        <Link to="/applications" className="mt-2 inline-block text-sm text-slate-900 underline">
          Back to applications
        </Link>
      </Shell>
    );
  }

  if (application === null) {
    return (
      <Shell title="Edit application">
        <p role="alert" className="mt-4 text-sm text-red-700">
          Could not load this application.
        </p>
      </Shell>
    );
  }

  return (
    <Shell title="Edit application">
      <ApplicationForm
        initialValues={formFromApplication(application)}
        submitLabel="Save changes"
        onSubmit={async (payload) => {
          await updateApplication(application.id, payload);
          void navigate(`/applications/${application.id}`);
        }}
        onCancel={() => {
          void navigate(`/applications/${application.id}`);
        }}
      />
    </Shell>
  );
}

import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApplicationForm } from '../applications/ApplicationForm';
import { createApplication, updateApplication } from '../applications/applicationsApi';
import { emptyForm, formFromApplication } from '../applications/schemas';
import { useApplication } from '../applications/useApplication';
import { PageLayout } from '../components/PageLayout';

export function NewApplicationPage() {
  const navigate = useNavigate();

  return (
    <PageLayout title="New application">
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
    </PageLayout>
  );
}

export function EditApplicationPage() {
  const params = useParams();
  const id = params.id ?? '';
  const navigate = useNavigate();
  const { application, status } = useApplication(id);

  if (status === 'loading') {
    return (
      <PageLayout title="Edit application">
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      </PageLayout>
    );
  }

  if (status === 'notFound') {
    return (
      <PageLayout title="Edit application">
        <p className="mt-4 text-sm text-slate-500">That application doesn’t exist.</p>
        <Link to="/applications" className="mt-2 inline-block text-sm text-slate-900 underline">
          Back to applications
        </Link>
      </PageLayout>
    );
  }

  if (application === null) {
    return (
      <PageLayout title="Edit application">
        <p role="alert" className="mt-4 text-sm text-red-700">
          Could not load this application.
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Edit application">
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
    </PageLayout>
  );
}

import { formatAppliedAt } from '../applications/formatStatus';
import { StatusBadge } from '../applications/StatusBadge';
import { useApplications } from '../applications/useApplications';
import { Header } from '../components/Header';

export function ApplicationsPage() {
  const { applications, status, error, reload } = useApplications();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Applications</h1>

        {status === 'loading' && (
          <p className="mt-4 text-sm text-slate-500">Loading applications…</p>
        )}

        {status === 'error' && (
          <div className="mt-4">
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={reload}
              className="mt-2 rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'success' && applications.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">No applications yet.</p>
        )}

        {status === 'success' && applications.length > 0 && (
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 font-medium">Company</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-900">{application.company}</td>
                  <td className="py-2 pr-4 text-slate-600">{application.role}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="py-2 text-slate-600">{formatAppliedAt(application.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

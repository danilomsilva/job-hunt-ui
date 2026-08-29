import { Header } from '../components/Header';

export function ApplicationsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          The list, filters, and CRUD views land in Stage 3.
        </p>
      </main>
    </div>
  );
}

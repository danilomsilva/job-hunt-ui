import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    await logout();
    void navigate('/login', { replace: true });
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-8 py-4">
      <nav aria-label="Main">
        <Link to="/applications" className="text-sm font-semibold text-slate-900">
          job-hunt
        </Link>
      </nav>
      <div className="flex items-center gap-4 text-sm text-slate-500">
        {user !== null && <span>{user.email}</span>}
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded border border-slate-300 px-3 py-1 font-medium text-slate-700"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

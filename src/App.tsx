import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { EditApplicationPage, NewApplicationPage } from './pages/ApplicationFormPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/new" element={<NewApplicationPage />} />
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="/applications/:id/edit" element={<EditApplicationPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/applications" replace />} />
    </Routes>
  );
}

export default App;

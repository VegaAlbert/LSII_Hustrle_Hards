import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './auth/AuthProvider';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import UploadPage from './pages/UploadPage';
import VideoDetailPage from './pages/VideoDetailPage';

// After logging in, go back to the page that sent the user here (e.g. /upload), or home
const LoginRoute = () => {
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  return <LoginPage onSuccess={() => navigate(from, { replace: true })} />;
};

/**
 * Routes of the app. Kept apart from the router so tests can render them inside a MemoryRouter.
 */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="login" element={<LoginRoute />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="upload" element={<UploadPage />} />
      <Route path="videos/:id" element={<VideoDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

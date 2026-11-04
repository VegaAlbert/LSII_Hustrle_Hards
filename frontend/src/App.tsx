import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './auth/AuthProvider';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import VideoDetailPage from './pages/VideoDetailPage';

const LoginRoute = () => {
  const navigate = useNavigate();
  return <LoginPage onSuccess={() => navigate('/')} />;
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

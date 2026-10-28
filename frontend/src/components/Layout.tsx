import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

/**
 * Navbar shared by every page; the current page renders in the Outlet.
 */
const Layout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="App">
      <NavBar onHome={() => navigate('/')} onLogin={() => navigate('/login')} showLogin={pathname !== '/login'} />
      <main className="container py-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

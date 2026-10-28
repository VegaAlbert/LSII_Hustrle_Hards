import { Outlet, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

/**
 * Navbar shared by every page; the current page renders in the Outlet.
 */
const Layout = () => {
  const navigate = useNavigate();

  return (
    <div className="App">
      <NavBar onHome={() => navigate('/')} onLogin={() => navigate('/login')} />
      <main className="container py-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

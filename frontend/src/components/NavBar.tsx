import { useState } from 'react';
import { useAuth } from '../auth/authContext';
import './NavBar.css';

type Props = {
  onHome: () => void;
  onLogin: () => void;
  // Hidden while the login page is already open
  showLogin?: boolean;
};

const NavBar = ({ onHome, onLogin, showLogin = true }: Props) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    onHome();
  };

  return (
    <nav className="pt-navbar">
      <button type="button" className="pt-brand" onClick={onHome}>
        <img src="/protube-imago-removebg-preview.png" alt="" />
        <span>ProTube</span>
      </button>

      {user ? (
        <div className="pt-user">
          <button
            type="button"
            className="pt-avatar"
            aria-label={`User menu for ${user.username}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {user.username.charAt(0).toUpperCase()}
          </button>
          {menuOpen && (
            <ul className="pt-menu">
              <li className="pt-menu-header">
                <strong>{user.username}</strong>
                <small>{user.email}</small>
              </li>
              <li>
                <button type="button" className="pt-menu-item" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : (
        showLogin && (
          <button type="button" className="pt-login-btn" onClick={onLogin}>
            Log in
          </button>
        )
      )}
    </nav>
  );
};

export default NavBar;

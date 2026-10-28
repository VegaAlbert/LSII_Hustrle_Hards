import { useState } from 'react';
import { useAuth } from '../auth/authContext';
import './NavBar.css';

type Props = {
  onHome: () => void;
  onLogin: () => void;
  onSettings: () => void;
  // Hidden while the login page is already open
  showLogin?: boolean;
};

const NavBar = ({ onHome, onLogin, onSettings, showLogin = true }: Props) => {
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
        <img src="/protube-logo.svg" alt="" />
        <span>ProTube</span>
      </button>

      <div className="pt-nav-actions">
        <button type="button" className="pt-icon-btn" aria-label="Settings" title="Settings" onClick={onSettings}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19.14 12.94a7.4 7.4 0 0 0 .06-.94 7.4 7.4 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7 7 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7 7 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.4 7.4 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.7 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54a7 7 0 0 0 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
            />
          </svg>
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
      </div>
    </nav>
  );
};

export default NavBar;

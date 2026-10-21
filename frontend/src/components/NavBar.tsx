import { useState } from 'react';
import { useAuth } from '../auth/authContext';

type Props = {
  onHome: () => void;
  onLogin: () => void;
};

const NavBar = ({ onHome, onLogin }: Props) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    onHome();
  };

  return (
    <nav className="navbar navbar-light bg-white border-bottom px-3">
      <button type="button" className="navbar-brand btn btn-link fs-3 p-0" onClick={onHome}>
        Pro Tube
      </button>

      {user ? (
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-secondary rounded-circle"
            style={{ width: 40, height: 40 }}
            aria-label={`User menu for ${user.username}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {user.username.charAt(0).toUpperCase()}
          </button>
          {menuOpen && (
            <ul className="dropdown-menu dropdown-menu-end show" style={{ right: 0, left: 'auto' }}>
              <li>
                <span className="dropdown-item-text fw-bold">{user.username}</span>
              </li>
              <li>
                <button type="button" className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : (
        <button type="button" className="btn btn-outline-primary" onClick={onLogin}>
          Log in
        </button>
      )}
    </nav>
  );
};

export default NavBar;

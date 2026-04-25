import './Navbar.css';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onViewChange: (view: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onViewChange }) => {
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <div className="logo" onClick={() => onViewChange('home')}>
          <span className="logo-icon">🏠</span>
          <span className="logo-text">ריאלטור</span>
        </div>
        <ul className="nav-links">
          <li><a href="#" onClick={() => onViewChange('home')}>ראשי</a></li>
          {user?.role === 'admin' && (
            <li><a href="#" onClick={() => onViewChange('admin')}>ניהול</a></li>
          )}
        </ul>
        <div className="nav-actions">
          {user ? (
            <div className="user-menu">
              <span>שלום, {user.full_name || user.phone}</span>
              <button onClick={onLogout} className="btn-secondary">התנתק</button>
            </div>
          ) : (
            <div className="auth-btns">
              <button onClick={() => onViewChange('login')} className="btn-secondary">כניסה</button>
              <button onClick={() => onViewChange('register')} className="btn-primary">הרשמה</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

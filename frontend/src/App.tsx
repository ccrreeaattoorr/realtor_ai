import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ListingCard from './components/ListingCard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminPage from './components/AdminPage';
import type { Listing, User } from './types';
import { fetchListings } from './api';
import './App.css';

const decodeToken = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const PaginationUI: React.FC<{ page: number; totalPages: number; onPageChange: (p: number) => void }> = ({ page, totalPages, onPageChange }) => (
  <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', margin: '2rem 0' }}>
    <button 
      disabled={page === 1} 
      onClick={() => onPageChange(page - 1)} 
      className="btn-secondary"
      style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}
    >
      ➡️
    </button>
    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{page} / {totalPages}</span>
    <button 
      disabled={page === totalPages} 
      onClick={() => onPageChange(page + 1)} 
      className="btn-secondary"
      style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}
    >
      ⬅️
    </button>
  </div>
);

function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  
  // Filters & Pagination
  const [city, setCity] = useState('');
  const [minRooms, setMinRooms] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [hasElevator, setHasElevator] = useState<boolean | undefined>();
  const [hasParking, setHasParking] = useState<boolean | undefined>();
  const [hasMamad, setHasMamad] = useState<boolean | undefined>();
  const [freeText, setFreeText] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser({ phone: decoded.sub, role: decoded.role, full_name: decoded.full_name });
      } else {
        localStorage.removeItem('token');
      }
    }
    loadData(1);
  }, []);

  const loadData = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetchListings(city, minRooms, maxPrice, p, hasElevator, hasParking, hasMamad, freeText);
      setListings(res.listings || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setError(null);
    } catch (err) {
      setError('חלה שגיאה בטעינת המודעות');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
  };

  const handlePageChange = (newPage: number) => {
    loadData(newPage);
    window.scrollTo(0, 0);
  };

  const safeTotal = Number(total) || 0;
  const totalPages = Math.max(1, Math.ceil(safeTotal / 5));

  return (
    <div className="app">
      <Navbar user={user} onLogout={() => { localStorage.removeItem('token'); setUser(null); setView('home'); }} onViewChange={setView} />
      
      {view === 'home' && (
        <>
          <header className="hero">
            <div className="container hero-content">
              <h1>מצא את בית חלומותיך</h1>
              <p>המרכז הגדול ביותר למודעות נדל"ן מבוסס בינה מלאכותית</p>
            </div>
          </header>

          <main className="container">
            <section className="search-section" style={{ marginTop: '-4rem', zIndex: 10, position: 'relative' }}>
              <form onSubmit={handleSearch} style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>חיפוש חופשי</label>
                    <input type="text" placeholder="מה תרצו למצוא? (לדוגמה: נוף לים, שקט...)" value={freeText} onChange={e => setFreeText(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>עיר</label>
                    <input type="text" placeholder="חיפה, תל אביב..." value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>חדרים (מינימום)</label>
                    <input type="number" step="0.5" value={minRooms || ''} onChange={e => setMinRooms(e.target.value ? parseFloat(e.target.value) : undefined)} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>מחיר מקסימלי</label>
                    <input type="number" value={maxPrice || ''} onChange={e => setMaxPrice(e.target.value ? parseInt(e.target.value) : undefined)} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', padding: '0 0.5rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasElevator || false} onChange={e => setHasElevator(e.target.checked || undefined)} />
                    מעלית
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasParking || false} onChange={e => setHasParking(e.target.checked || undefined)} />
                    חניה
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasMamad || false} onChange={e => setHasMamad(e.target.checked || undefined)} />
                    ממ"ד
                  </label>
                  <div style={{ flex: 1 }}></div>
                  <button type="submit" className="btn-primary" style={{ padding: '0.8rem 3rem' }}>חפש</button>
                </div>
              </form>
            </section>

            <section className="listings-section" style={{ padding: '2rem 0 4rem' }}>
              <div className="section-header" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h2>מודעות אחרונות ({safeTotal})</h2>
              </div>

              {loading ? (
                <div className="loading">טוען נתונים...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : listings.length === 0 ? (
                <div className="no-results">לא נמצאו מודעות.</div>
              ) : (
                <>
                  {totalPages > 1 && <PaginationUI page={page} totalPages={totalPages} onPageChange={handlePageChange} />}
                  
                  <div className="property-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>

                  {totalPages > 1 && <PaginationUI page={page} totalPages={totalPages} onPageChange={handlePageChange} />}
                </>
              )}
            </section>
          </main>
        </>
      )}

      {view === 'login' && <LoginPage onLoginSuccess={(token) => { localStorage.setItem('token', token); const d = decodeToken(token); setUser({ phone: d.sub, role: d.role, full_name: d.full_name }); setView('home'); loadData(1); }} onSwitchToRegister={() => setView('register')} />}
      {view === 'register' && <RegisterPage onRegisterSuccess={() => setView('login')} onSwitchToLogin={() => setView('login')} />}
      {view === 'admin' && user?.role === 'admin' && <AdminPage />}

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 ריאלטור - כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

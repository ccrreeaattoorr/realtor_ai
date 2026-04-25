import React, { useState, useEffect } from 'react';
import { uploadListingsFile, fetchAdminStats, fetchListings, deleteListing, updateListing, bulkDeleteListings, fetchUploadStatus } from '../api';
import type { Listing } from '../types';

const PaginationUI: React.FC<{ page: number; totalPages: number; onPageChange: (p: number) => void }> = ({ page, totalPages, onPageChange }) => (
  <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', margin: '1.5rem 0' }}>
    <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className="btn-secondary" style={{ padding: '0.3rem 0.8rem' }}>➡️</button>
    <span style={{ fontWeight: 'bold' }}>{page} / {totalPages}</span>
    <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="btn-secondary" style={{ padding: '0.3rem 0.8rem' }}>⬅️</button>
  </div>
);

const AdminPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Listing>>({});
  
  // Listings Filters & Pagination
  const [city, setCity] = useState('');
  const [minRooms, setMinRooms] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Bulk delete state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async (p: number = 1) => {
    try {
      const s = await fetchAdminStats();
      setStats(s);
      const res = await fetchListings(city, minRooms, undefined, p);
      setListings(res.listings || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  // Polling for upload progress
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(async () => {
        try {
          const res = await fetchUploadStatus();
          if (res.status === 'processing') {
            setPercent(res.percent);
            setStatus(res.message);
          } else if (res.status === 'idle' && percent > 0) {
            setPercent(100);
            setStatus('העלאה הושלמה!');
            setLoading(false);
            loadData(1);
          }
        } catch (e) {}
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading, percent]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setPercent(0);
    setStatus('מתחיל העלאה...');
    try {
      await uploadListingsFile(file);
    } catch (err) {
      setStatus('שגיאה בהעלאת הקובץ');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מודעה זו?')) return;
    try {
      await deleteListing(id);
      loadData(page);
    } catch (err) {
      alert('מחיקה נכשלה');
    }
  };

  const handleBulkDelete = async () => {
    if (!startDate || !endDate) return;
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את כל המודעות בין ${startDate} ל-${endDate}?`)) return;
    try {
      await bulkDeleteListings(startDate, endDate);
      alert('מחיקה המונית הושלמה');
      loadData(1);
    } catch (err) {
      alert('מחיקה המונית נכשלה');
    }
  };

  const startEdit = (listing: Listing) => {
    setEditingId(listing.id || null);
    setEditForm(listing);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateListing(editingId, editForm as Listing);
      setEditingId(null);
      loadData(page);
    } catch (err) {
      alert('עדכון נכשל');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 5));

  return (
    <div className="admin-page container" style={{ padding: '2rem 0' }}>
      <h1>ניהול מערכת</h1>
      
      {/* Stats Section */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', margin: '2rem 0' }}>
        <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
          <h3>סה"כ מודעות במערכת</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats?.total_listings || 0}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* Upload Section */}
        <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h3>העלאת קובץ הודעות (AI)</h3>
          <form onSubmit={handleUpload} style={{ marginTop: '1rem' }}>
            <input type="file" accept=".txt" onChange={(e) => setFile(e.target.files?.[0] || null)} required style={{ marginBottom: '1rem', display: 'block' }} />
            {loading && (
              <div className="progress-container" style={{ marginBottom: '1rem' }}>
                <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.5s ease' }}></div>
                </div>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{percent}% - {status}</p>
              </div>
            )}
            {!loading && status && <p style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{status}</p>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'מעבד...' : 'העלה ונתח'}
            </button>
          </form>
        </div>

        {/* Bulk Delete Section */}
        <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h3>מחיקה המונית לפי תאריכים</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label>מתאריך:</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>עד תאריך:</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <button onClick={handleBulkDelete} className="btn-secondary" style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}>מחק טווח תאריכים</button>
          </div>
        </div>
      </div>

      {/* Listings Management */}
      <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>ניהול מודעות ({total})</h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" placeholder="עיר..." value={city} onChange={e => setCity(e.target.value)} style={{ padding: '0.4rem', width: '100px' }} />
            <input type="number" placeholder="חדרים..." value={minRooms || ''} onChange={e => setMinRooms(e.target.value ? parseFloat(e.target.value) : undefined)} style={{ padding: '0.4rem', width: '80px' }} />
            <button type="submit" className="btn-primary" style={{ padding: '0.4rem 1rem' }}>סנן</button>
          </form>
        </div>

        {totalPages > 1 && <PaginationUI page={page} totalPages={totalPages} onPageChange={loadData} />}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'right' }}>
              <th>עיר</th>
              <th>רחוב</th>
              <th>חדרים</th>
              <th>מחיר</th>
              <th>קומה</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                {editingId === l.id ? (
                  <>
                    <td><input type="text" value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})} style={{width:'80px'}} /></td>
                    <td><input type="text" value={editForm.street || ''} onChange={e => setEditForm({...editForm, street: e.target.value})} style={{width:'100px'}} /></td>
                    <td><input type="number" step="0.5" value={editForm.rooms || ''} onChange={e => setEditForm({...editForm, rooms: parseFloat(e.target.value)})} style={{width:'50px'}} /></td>
                    <td><input type="number" value={editForm.price || ''} onChange={e => setEditForm({...editForm, price: parseInt(e.target.value)})} style={{width:'80px'}} /></td>
                    <td><input type="number" value={editForm.floor || ''} onChange={e => setEditForm({...editForm, floor: parseInt(e.target.value)})} style={{width:'40px'}} /></td>
                    <td style={{ padding: '1rem 0' }}>
                      <button onClick={saveEdit} className="btn-primary" style={{padding: '0.2rem 0.5rem', marginLeft: '0.5rem'}}>שמור</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary" style={{padding: '0.2rem 0.5rem'}}>בטל</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{l.city}</td>
                    <td>{l.street}</td>
                    <td>{l.rooms}</td>
                    <td>{l.price}</td>
                    <td>{l.floor}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <button onClick={() => startEdit(l)} style={{background: 'none', color: 'var(--primary)', cursor: 'pointer', marginLeft: '1rem', fontWeight: 'bold'}}>ערוך</button>
                      <button onClick={() => handleDelete(l.id!)} style={{background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold'}}>מחק</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && <PaginationUI page={page} totalPages={totalPages} onPageChange={loadData} />}
      </div>
    </div>
  );
};

export default AdminPage;

import React from 'react';
import type { Listing } from '../types';
import './ListingCard.css';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const [showFull, setShowFull] = React.useState(false);
  
  if (!listing) return null;

  const formattedPrice = listing.price 
    ? new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        maximumFractionDigits: 0,
      }).format(listing.price)
    : 'מחיר לא צוין';

  return (
    <div className="listing-card">
      <div className="listing-details">
        <h3 className="listing-price">{formattedPrice}</h3>
        <h4 className="listing-title">
          {listing.street || 'רחוב לא ידוע'}, {listing.city || 'עיר לא ידועה'}
        </h4>
        <div className="listing-specs">
          <span>{listing.rooms || '?'} חדרים</span>
          <span>קומה {listing.floor !== null ? listing.floor : '?'} מתוך {listing.total_floors || '?'}</span>
        </div>
        <div className="listing-features">
          {listing.has_elevator && <span className="feature">מעלית ✅</span>}
          {listing.has_parking && <span className="feature">חניה ✅</span>}
          {listing.has_mamad && <span className="feature">ממ"ד ✅</span>}
        </div>
        <p className="listing-raw">
          {listing.raw_text 
            ? (showFull ? listing.raw_text : `${listing.raw_text.substring(0, 150)}...`)
            : 'אין טקסט זמין'}
        </p>
        {listing.raw_text && listing.raw_text.length > 150 && (
          <button 
            onClick={() => setShowFull(!showFull)} 
            style={{ background: 'none', color: 'var(--primary)', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.5rem', fontWeight: 'bold' }}
          >
            {showFull ? 'הצג פחות' : 'קרא עוד...'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingCard;

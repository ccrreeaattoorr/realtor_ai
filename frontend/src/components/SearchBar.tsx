import React, { useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (location: string, maxPrice: number | undefined) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [location, setLocation] = useState('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(location, maxPrice ? parseFloat(maxPrice) : undefined);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input">
        <label>Location</label>
        <input 
          type="text" 
          placeholder="Where are you looking?" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className="search-divider"></div>
      <div className="search-input">
        <label>Max Price</label>
        <input 
          type="number" 
          placeholder="Max Price" 
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>
      <button type="submit" className="search-button">
        🔍 Search
      </button>
    </form>
  );
};

export default SearchBar;

import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import DestinationCard from './DestinationCard';
import '../styles/destination.css';

export default function SearchBar({ initialResult }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(initialResult || null);
  const [suggestions, setSuggestions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [noSuggestions, setNoSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Restore destination data when navigating back from Details page
  useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
    }
  }, [initialResult]);

  const handleSearch = async (searchTerm = query) => {
    const term = String(searchTerm || '').trim();
    if (!term) {
      setError('Please enter a city name.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setDropdownOpen(false);
    try {
      const response = await api.get('/destination/search', { params: { city: term } });
      if (response.data && response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data?.message || 'No results found.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch destination.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (text) => {
    if (!text.trim()) {
      setSuggestions([]);
      setNoSuggestions(false);
      setDropdownOpen(false);
      return;
    }

    setSuggestionsLoading(true);
    setNoSuggestions(false);
    try {
      const response = await api.get('/destination/autocomplete', { params: { text } });
      const data = response.data;
      if (data?.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setNoSuggestions(false);
        setDropdownOpen(true);
        setActiveIndex(-1);
      } else {
        setSuggestions([]);
        setNoSuggestions(true);
        setDropdownOpen(true);
      }
    } catch (err) {
      setSuggestions([]);
      setNoSuggestions(true);
      setDropdownOpen(true);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setSuggestions([]);
      setDropdownOpen(false);
      setNoSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query.trim());
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' && dropdownOpen && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
      return;
    }

    if (e.key === 'ArrowUp' && dropdownOpen && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex <= 0 ? suggestions.length - 1 : prevIndex - 1));
      return;
    }

    if (e.key === 'Enter') {
      if (dropdownOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        const item = suggestions[activeIndex];
        handleSuggestionSelect(item);
        return;
      }
      handleSearch();
      return;
    }

    if (e.key === 'Escape') {
      setDropdownOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setQuery(suggestion.name);
    setDropdownOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    handleSearch(suggestion.name);
  };

  const reset = () => {
    setQuery('');
    setError('');
    setResult(null);
    setSuggestions([]);
    setDropdownOpen(false);
    setActiveIndex(-1);
    setNoSuggestions(false);
  };

  return (
    <div className="destination-search centered" ref={searchRef}>
      <h2 className="search-title">Search Destination</h2>

      <div className="search-box">
        <div className="search-input-wrap">
          <span className="input-icon">📍</span>
          <input
            aria-label="Search city"
            placeholder="Search cities, tourist places, temples, beaches..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button onClick={() => handleSearch()} className="search-btn primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>

        {dropdownOpen && (
          <div className="autocomplete-dropdown">
            {suggestionsLoading && <div className="autocomplete-item loading">Loading suggestions...</div>}
            {!suggestionsLoading && suggestions.map((item, index) => (
              <button
                key={`${item.id}-${item.formatted}`}
                type="button"
                className={`autocomplete-item ${activeIndex === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSuggestionSelect(item)}
              >
                <span className="suggestion-name">{item.name}</span>
                <span className="suggestion-meta">{[item.state, item.country].filter(Boolean).join(', ')}</span>
              </button>
            ))}
            {!suggestionsLoading && noSuggestions && (
              <div className="autocomplete-item no-results">No matching destinations</div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-row">
          <div className="loader" />
          <span>Looking up destination...</span>
        </div>
      )}

      {error && (
        <div className="error-row">
          <p className="error">{error}</p>
          <button className="secondary" onClick={reset}>
            Search again
          </button>
        </div>
      )}

      {result && result.success && <DestinationCard data={result} onReset={reset} />}
    </div>
  );
}

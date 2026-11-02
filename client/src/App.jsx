// client/src/App.jsx
import { useState } from 'react';
import { products } from './products';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      setError('Please enter a longer query (at least 3 characters).');
      return;
    }

    setIsLoading(true);
    setError('');
    setRecommendations(null);

    try {
      // The Vite proxy handles routing /api to localhost:5000
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const message = response.ok
          ? 'The server returned an unexpected response.'
          : `The server returned an error (${response.status}). Please try again later.`;
        throw new Error(message);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>✨ AI Product Recommender</h1>
        <p>Describe what you're looking for, and our AI will find the perfect match from our catalog.</p>
      </header>

      {/* Search Input Section */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., I need a phone under $500 for photography..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? 'Searching...' : 'Find Products'}
        </button>
      </form>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* AI Recommendations Section */}
      {recommendations && recommendations.length > 0 && (
        <section className="recommendations-section">
          <h2>🎯 Top Matches for You</h2>
          <div className="product-grid">
            {recommendations.map((product) => (
              <div key={product.id} className="product-card recommended">
                <div className="ai-badge">AI Pick</div>
                <h3>{product.name}</h3>
                <p className="price">${product.price.toFixed(2)}</p>
                <p className="description">{product.description}</p>
                <div className="reason-box">
                  <strong>Why it matches:</strong>
                  <p>{product.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendations && recommendations.length === 0 && (
        <div className="no-results">
          No products matched your criteria. Try adjusting your search!
        </div>
      )}

      {/* Full Catalog Section (Only show if no recommendations are active) */}
      {!recommendations && (
        <section className="catalog-section">
          <h2>📦 Full Product Catalog</h2>
          <div className="product-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p className="price">${product.price.toFixed(2)}</p>
                <p className="description">{product.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;   
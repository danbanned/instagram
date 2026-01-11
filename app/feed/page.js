'use client';

import { useState, useEffect, useCallback } from 'react';

export default function FeedPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingHearts, setUpdatingHearts] = useState({});
  const [error, setError] = useState('');

  const fetchFeed = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feed?page=${pageNum}&limit=10`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch feed');
      }

      if (pageNum === 1) {
        setImages(data.images);
      } else {
        setImages(prev => [...prev, ...data.images]);
      }
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(page);
  }, [page, fetchFeed]);

  const handleHeartClick = async (id, currentHearts) => {
    try {
      setUpdatingHearts(prev => ({ ...prev, [id]: true }));
      
      const response = await fetch('/api/feed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hearts: currentHearts + 1 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update hearts');
      }

      // Update local state
      setImages(prev => 
        prev.map(img => 
          img.id === id ? { ...img, hearts: data.hearts } : img
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingHearts(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Image Feed</h1>
      <p style={styles.description}>See what others have created with AI</p>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && images.length === 0 ? (
        <div style={styles.loading}>Loading images...</div>
      ) : images.length === 0 ? (
        <div style={styles.empty}>No images yet. Be the first to generate one!</div>
      ) : (
        <>
          <div style={styles.grid}>
            {images.map((image) => (
              <div key={image.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <p style={styles.prompt}>{image.prompt}</p>
                  <div style={styles.date}>{formatDate(image.createdAt)}</div>
                </div>
                <div style={styles.imageContainer}>
                  <img
                    src={image.imageUrl}
                    alt={image.prompt}
                    style={styles.cardImage}
                  />
                </div>
                <div style={styles.cardFooter}>
                  <button
                    onClick={() => handleHeartClick(image.id, image.hearts)}
                    disabled={updatingHearts[image.id]}
                    style={styles.heartButton}
                  >
                    ❤️ {image.hearts}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {page < totalPages && (
            <div style={styles.loadMoreContainer}>
              <button
                onClick={handleLoadMore}
                disabled={loading}
                style={styles.loadMoreButton}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {totalPages > 0 && (
            <div style={styles.paginationInfo}>
              Page {page} of {totalPages} • {images.length} images
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#333',
  },
  description: {
    color: '#666',
    marginBottom: '2rem',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  },
  cardHeader: {
    padding: '1rem',
  },
  prompt: {
    fontSize: '0.95rem',
    color: '#333',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  date: {
    fontSize: '0.8rem',
    color: '#999',
  },
  imageContainer: {
    position: 'relative',
    paddingTop: '100%', // Square aspect ratio
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardFooter: {
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
  },
  heartButton: {
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  heartButtonHover: {
    backgroundColor: '#fff0f0',
    color: '#c00',
  },
  loadMoreContainer: {
    textAlign: 'center',
    margin: '2rem 0',
  },
  loadMoreButton: {
    padding: '0.75rem 2rem',
    fontSize: '1rem',
  },
  paginationInfo: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9rem',
    marginTop: '1rem',
  },
};
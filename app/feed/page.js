'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function FeedPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingHearts, setUpdatingHearts] = useState({});
  const [error, setError] = useState('');
  
  // Image generation state
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [suggestedPrompts] = useState([
    "A futuristic cityscape at sunset",
    "A magical forest with glowing mushrooms",
    "An astronaut exploring an alien planet",
    "A steampunk mechanical dragon",
    "A serene Japanese garden in autumn",
    "A cyberpunk street market at night",
    "A fantasy castle floating in the clouds",
    "An underwater civilization with mermaids",
    "A cozy cottage in a winter wonderland",
    "A surreal landscape with floating islands"
  ]);

  // Image generation function
  async function generateImage(prompt) {
    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) throw new Error("Image generation failed");

    const blob = await res.blob();
    const imageUrl = URL.createObjectURL(blob);

    return imageUrl;
  }

  // Fetch feed images
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

  // Handle image generation
  const handleGenerateImage = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setError('');

    try {
      // Generate image using the new method
      const imageBlobUrl = await generateImage(prompt);
      
      // Create a temporary image object for immediate display
      const tempImage = {
        id: `temp-${Date.now()}`,
        prompt,
        imageUrl: imageBlobUrl,
        hearts: 0,
        createdAt: new Date().toISOString(),
        isTemporary: true
      };

      // Add to beginning of feed
      setImages(prev => [tempImage, ...prev]);
      
      // Clear prompt and close generator
      setPrompt('');
      setShowGenerator(false);
      
      // Show success message
      setError('🎉 Image generated successfully!');
      setTimeout(() => setError(''), 5000);
      
      // Note: The image should be automatically saved by your backend
      // when calling /api/feed POST endpoint
      
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseSuggestedPrompt = (suggestedPrompt) => {
    setPrompt(suggestedPrompt);
    setShowGenerator(true);
  };

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

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any blob URLs
      images.forEach(image => {
        if (image.isTemporary && image.imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(image.imageUrl);
        }
      });
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>AI Image Feed</h1>
          <p style={styles.description}>
            Create and explore AI-generated images
          </p>
        </div>
        
        <button 
          onClick={() => setShowGenerator(!showGenerator)}
          style={styles.generateButton}
        >
          {showGenerator ? '✕ Close Generator' : '✨ Generate New Image'}
        </button>
      </div>

      {showGenerator && (
        <div style={styles.generatorCard}>
          <h3 style={styles.generatorTitle}>Generate AI Image</h3>
          <p style={styles.generatorDescription}>
            Describe what you want to generate. The more detailed, the better!
          </p>
          
          <form onSubmit={handleGenerateImage}>
            <div style={styles.promptInputGroup}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt to generate an image (e.g., A majestic dragon flying over a medieval castle at sunset)"
                rows="3"
                style={styles.promptInput}
                disabled={generating}
              />
              
              <button 
                type="submit" 
                disabled={generating || !prompt.trim()}
                style={styles.submitButton}
              >
                {generating ? (
                  <>
                    <div style={styles.spinner}></div>
                    Generating...
                  </>
                ) : (
                  'Generate Image'
                )}
              </button>
            </div>
          </form>

          {!prompt && (
            <div style={styles.suggestedPrompts}>
              <p style={styles.suggestedTitle}>Need inspiration? Try these:</p>
              <div style={styles.promptGrid}>
                {suggestedPrompts.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleUseSuggestedPrompt(suggestion)}
                    style={styles.promptButton}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          ...styles.message,
          backgroundColor: error.includes('successfully') ? '#d1fae5' : '#fee',
          color: error.includes('successfully') ? '#065f46' : '#c00',
        }}>
          <strong>{error.includes('successfully') ? '🎉 Success!' : '⚠️ Error:'}</strong> {error}
        </div>
      )}

      {loading && images.length === 0 ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          Loading images...
        </div>
      ) : images.length === 0 ? (
        <div style={styles.empty}>
          <p>No images yet. Be the first to generate one!</p>
          <button 
            onClick={() => setShowGenerator(true)}
            style={styles.ctaButton}
          >
            Create Your First Image
          </button>
        </div>
      ) : (
        <>
          <div style={styles.stats}>
            <span>🎨 {images.length} images generated</span>
            <span>❤️ {images.reduce((sum, img) => sum + img.hearts, 0)} total hearts</span>
          </div>

          <div style={styles.grid}>
            {images.map((image) => (
              <div 
                key={image.id} 
                style={{
                  ...styles.card,
                  ...(image.isTemporary ? styles.temporaryCard : {})
                }}
              >
                {image.isTemporary && (
                  <div style={styles.temporaryBadge}>New!</div>
                )}
                
                <div style={styles.cardHeader}>
                  <p style={styles.prompt}>{image.prompt}</p>
                  <div style={styles.date}>{formatDate(image.createdAt)}</div>
                </div>
                <div style={styles.imageContainer}>
                  <img
                    src={image.imageUrl}
                    alt={image.prompt}
                    style={styles.cardImage}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x300/EEE/CCC?text=Image+Loading+Error';
                    }}
                  />
                </div>
                <div style={styles.cardFooter}>
                  <button
                    onClick={() => handleHeartClick(image.id, image.hearts)}
                    disabled={updatingHearts[image.id] || image.isTemporary}
                    style={{
                      ...styles.heartButton,
                      ...(image.isTemporary ? styles.disabledButton : {})
                    }}
                  >
                    ❤️ {image.hearts}
                  </button>
                  
                  {image.isTemporary && (
                    <span style={styles.savingNotice}>New image</span>
                  )}
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
                {loading ? 'Loading...' : 'Load More Images'}
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
    padding: '0 20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: '#333',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  description: {
    color: '#666',
    fontSize: '1.1rem',
    marginBottom: '0',
  },
  generateButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
    },
  },
  generatorCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  generatorTitle: {
    fontSize: '1.5rem',
    color: '#333',
    marginBottom: '0.5rem',
  },
  generatorDescription: {
    color: '#666',
    marginBottom: '1.5rem',
    fontSize: '1rem',
  },
  promptInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  promptInput: {
    width: '100%',
    padding: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
    boxSizing: 'border-box',
    ':focus': {
      outline: 'none',
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
    },
  },
  submitButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    ':hover:not(:disabled)': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  suggestedPrompts: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e7eb',
  },
  suggestedTitle: {
    color: '#666',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  promptGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '0.75rem',
  },
  promptButton: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
      transform: 'translateY(-1px)',
    },
  },
  message: {
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontWeight: '500',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666',
    fontSize: '1.1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    marginTop: '2rem',
  },
  ctaButton: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1rem',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
    },
  },
  stats: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
    color: '#666',
    fontSize: '0.9rem',
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
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
    },
  },
  temporaryCard: {
    border: '2px solid #3b82f6',
  },
  temporaryBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    zIndex: '1',
  },
  cardHeader: {
    padding: '1.25rem',
  },
  prompt: {
    fontSize: '1rem',
    color: '#333',
    marginBottom: '0.5rem',
    fontWeight: '500',
    lineHeight: '1.4',
  },
  date: {
    fontSize: '0.8rem',
    color: '#999',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '250px',
    backgroundColor: '#f5f5f5',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardFooter: {
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartButton: {
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    padding: '0.5rem 1.25rem',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#fff0f0',
      color: '#c00',
      borderColor: '#fca5a5',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  savingNotice: {
    fontSize: '0.8rem',
    color: '#666',
    fontStyle: 'italic',
  },
  loadMoreContainer: {
    textAlign: 'center',
    margin: '3rem 0',
  },
  loadMoreButton: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
      transform: 'translateY(-2px)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  paginationInfo: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9rem',
    marginTop: '1rem',
    paddingBottom: '2rem',
  },
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  
  const animations = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
  `;
  
  const styleElement = document.createElement('style');
  styleElement.textContent = animations;
  document.head.appendChild(styleElement);
}
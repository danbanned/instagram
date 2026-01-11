 'use client';

import { useState } from 'react';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedImage) return;

    setPublishing(true);
    setError('');
    
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: generatedImage.imageUrl,
          prompt: generatedImage.prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish image');
      }

      setSuccess('Image published successfully!');
      setGeneratedImage(null);
      setPrompt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Generate AI Images</h1>
      <p style={styles.description}>Describe the image you want to create:</p>
      
      <div style={styles.form}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A beautiful sunset over mountains, digital art..."
          disabled={generating}
          style={styles.textarea}
        />
        
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          style={styles.button}
        >
          {generating ? 'Generating...' : 'Generate Image'}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={styles.success}>
          <strong>Success:</strong> {success}
        </div>
      )}

      {generatedImage && (
        <div style={styles.result}>
          <h2>Generated Image</h2>
          <p><strong>Prompt:</strong> {generatedImage.prompt}</p>
          <div style={styles.imageContainer}>
            <img
              src={generatedImage.imageUrl}
              alt={generatedImage.prompt}
              style={styles.image}
            />
          </div>
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={styles.publishButton}
          >
            {publishing ? 'Publishing...' : 'Publish to Feed'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#333',
  },
  description: {
    color: '#666',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
  },
  textarea: {
    padding: '1rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    resize: 'vertical',
    minHeight: '120px',
  },
  button: {
    alignSelf: 'flex-start',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  success: {
    backgroundColor: '#efe',
    color: '#090',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  result: {
    marginTop: '2rem',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  imageContainer: {
    margin: '1rem 0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  publishButton: {
    marginTop: '1rem',
    backgroundColor: '#28a745',
  },
  publishButtonHover: {
    backgroundColor: '#218838',
  },
};
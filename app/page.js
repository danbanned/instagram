'use client';

import { useState } from 'react';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState(null);
  const [error, setError] = useState('');
  const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  description: {
    color: '#666',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  textarea: {
    padding: '1rem',
    fontSize: '1rem',
    borderRadius: '8px',
    minHeight: '120px',
  },
  button: {
    alignSelf: 'flex-start',
  },
  error: {
    backgroundColor: '#fee',
    padding: '1rem',
    borderRadius: '8px',
  },
  result: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#fff',
    borderRadius: '12px',
  },
  output: {
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
  },
};


  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedText(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate text');
      }

      setGeneratedText(data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Generate AI Text</h1>
      <p style={styles.description}>
        Enter a prompt to generate donor summaries or notes.
      </p>

      <div style={styles.form}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write a warm donor summary for Jane Doe..."
          disabled={generating}
          style={styles.textarea}
        />

        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          style={styles.button}
        >
          {generating ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {generatedText && (
        <div style={styles.result}>
          <h2>Generated Text</h2>
          <pre style={styles.output}>{generatedText}</pre>
        </div>
      )}
    </div>
  );
}



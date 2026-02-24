import { useState } from 'react';
import { createPost } from '../services/postService';

export default function PostComposer({ onCreated }) {
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!media) return setError('Select an image or video');
    setLoading(true);
    setError('');

    try {
      await createPost({ caption, media });
      setCaption('');
      setMedia(null);
      e.target.reset();
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>Create Post</h2>
      <textarea placeholder="Write a caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
      <input type="file" accept="image/*,video/*" onChange={(e) => setMedia(e.target.files?.[0] || null)} />
      {error && <p className="error">{error}</p>}
      <button disabled={loading} type="submit">{loading ? 'Posting...' : 'Post'}</button>
    </form>
  );
}

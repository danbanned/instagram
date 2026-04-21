import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '../services/postService';
import useAuth from '../hooks/useAuth';

export default function PostComposer({ onCreated }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      setCaption('');
      setMedia(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (onCreated) onCreated();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create post');
    }
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!media) return setError('Select an image or video');
    setError('');
    
    mutation.mutate({ caption, media });
    e.target.reset();
  };

  return (
    <form className="card post-composer" onSubmit={submit}>
      <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Create Post</h2>
      <textarea 
        placeholder="Write a caption..." 
        value={caption} 
        onChange={(e) => setCaption(e.target.value)}
        style={{ width: '100%', minHeight: '80px', padding: '8px', border: '1px solid #dbdbdb', borderRadius: '4px', marginBottom: '10px' }}
      />
      <input 
        type="file" 
        accept="image/*,video/*" 
        onChange={(e) => setMedia(e.target.files?.[0] || null)}
        style={{ marginBottom: '10px' }}
      />
      {error && <p className="error" style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
      <button 
        disabled={mutation.isPending} 
        type="submit"
        style={{ 
          background: '#0095f6', 
          color: '#fff', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '4px', 
          fontWeight: '600',
          cursor: mutation.isPending ? 'not-allowed' : 'pointer'
        }}
      >
        {mutation.isPending ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}

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

}

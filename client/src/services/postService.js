import api from './api';

export const fetchFeed = async ({ cursor, limit = 10 } = {}) => {
  const params = new URLSearchParams({ limit });
  if (cursor) params.set('cursor', cursor);
  return (await api.get(`/posts/feed?${params}`)).data;
};

export const createPost = async ({ caption, media }) => {
  const formData = new FormData();
  if (caption) formData.append('caption', caption);
  formData.append('media', media);
  return (await api.post('/posts', formData)).data;
};

export const toggleLike = async (postId) => (await api.post(`/posts/${postId}/like`)).data;
export const addComment = async (postId, text) => (await api.post(`/posts/${postId}/comments`, { text })).data;
export const toggleSave = async (postId) => (await api.post(`/posts/${postId}/save`)).data;
export const toggleFollow = async (userId) => (await api.post(`/posts/users/${userId}/follow`)).data;

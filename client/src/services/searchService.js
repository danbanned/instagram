import api from './api';

export const fetchSearchResults = async ({ q = '', type = 'top', page = 1, limit = 18 } = {}) => {
  const params = new URLSearchParams();

  if (q) params.set('q', q);
  params.set('type', type);
  params.set('page', page);
  params.set('limit', limit);

  const response = await api.get(`/search?${params.toString()}`);
  return response.data;
};

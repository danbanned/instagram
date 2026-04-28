import api from './api';

export const fetchHighlights = async (userId) => {
  const response = await api.get(`/highlights/${userId}`);
  return response.data;
};

export const createHighlight = async (highlightData) => {
  const response = await api.post('/highlights', highlightData);
  return response.data;
};

export const updateHighlight = async (id, highlightData) => {
  const response = await api.put(`/highlights/${id}`, highlightData);
  return response.data;
};

export const deleteHighlight = async (id) => {
  const response = await api.delete(`/highlights/${id}`);
  return response.data;
};

export const fetchHighlightStories = async (id) => {
  const response = await api.get(`/highlights/${id}/stories`);
  return response.data;
};

// Add to Story service or use here:
export const fetchArchivedStories = async () => {
  const response = await api.get('/stories/archived');
  return response.data;
};

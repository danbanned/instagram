import api from './api';

export const fetchStoryTray = async () => (await api.get('/stories/tray')).data;
export const fetchUserStories = async (userId) => (await api.get(`/stories/user/${userId}`)).data;
export const markStorySeen = async (storyId) => (await api.post(`/stories/${storyId}/seen`)).data;
export const trackView = async (storyId, data = {}) => (await api.post(`/stories/${storyId}/view`, data)).data;
export const createStory = async (formData) => (await api.post('/stories', formData)).data;
export const deleteStory = async (storyId) => (await api.delete(`/stories/${storyId}`)).data;
export const replyToStory = async (storyId, text) => (await api.post(`/stories/${storyId}/reply`, { text })).data;
export const addReaction = async (storyId, type) => (await api.post(`/stories/${storyId}/reaction`, { type })).data;

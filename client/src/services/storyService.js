import api from './api';

export const fetchStoryTray = async () => (await api.get('/stories/tray')).data;

export const fetchUserStories = async (userId) => (await api.get(`/stories/user/${userId}`)).data;

export const markStorySeen = async (storyId) =>
  (await api.post(`/stories/${storyId}/seen`)).data;

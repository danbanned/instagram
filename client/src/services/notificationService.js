import api from './api';

export const fetchNotifications = async ({ page = 1, limit = 20, type = 'all' } = {}) =>
  (await api.get(`/notifications?page=${page}&limit=${limit}&type=${type}`)).data;

export const markNotificationRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data;
export const markNotificationsRead = async () => (await api.patch('/notifications/read-all')).data;
export const fetchUnreadNotificationCount = async () => (await api.get('/notifications/unread-count')).data;
export const fetchSuggestedUsers = async () => (await api.get('/users/suggestions')).data;

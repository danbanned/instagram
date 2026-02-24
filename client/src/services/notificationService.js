import api from './api';

export const fetchNotifications = async () => (await api.get('/notifications')).data;
export const markNotificationsRead = async () => (await api.patch('/notifications/read')).data;

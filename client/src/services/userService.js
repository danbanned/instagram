import api from './api';

export const fetchUserProfile = async (userId) => (await api.get(`/users/${userId}`)).data;

export const fetchUserPosts = async (userId) => (await api.get(`/users/${userId}/posts`)).data;

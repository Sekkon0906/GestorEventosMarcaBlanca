import client from './client.js';

export const analyticsApi = {
  overview: () => client.get('/api/analytics').then(r => r.data),
};

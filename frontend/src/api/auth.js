import client from './client.js';

export const authApi = {
  register : (fields)           => client.post('/auth/register', fields).then(r => r.data),
  login    : (email, password)  => client.post('/auth/login', { email, password }).then(r => r.data),
  me       : ()                 => client.get('/auth/me').then(r => r.data),
  updateMe : (fields)           => client.patch('/auth/me', fields).then(r => r.data),
};

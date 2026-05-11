import client from './client.js';

export const eventosApi = {
  list       : (params = {})      => client.get('/eventos', { params }).then(r => r.data),
  get        : (id)               => client.get(`/eventos/${id}`).then(r => r.data),
  create     : (body)             => client.post('/eventos', body).then(r => r.data),
  update     : (id, body)         => client.patch(`/eventos/${id}`, body).then(r => r.data),
  delete     : (id)               => client.delete(`/eventos/${id}`).then(r => r.data),
  publicar   : (id)               => client.post(`/eventos/${id}/publicar`).then(r => r.data),
  cancelar   : (id)               => client.post(`/eventos/${id}/cancelar`).then(r => r.data),
  asistentes : (id)               => client.get(`/eventos/${id}/asistentes`).then(r => r.data),
  inscribirse: (id)               => client.post(`/eventos/${id}/inscribirse`).then(r => r.data),
  categorias : (q = '')           => client.get('/eventos/categorias', { params: { q } }).then(r => r.data),
};

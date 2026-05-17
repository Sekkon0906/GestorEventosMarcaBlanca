import client from './client.js';

export const waitlistApi = {
  /* Público (sin auth) */
  anotarse : (slug, body)            => client.post(`/eventos/publicos/slug/${slug}/waitlist`, body).then(r => r.data),

  /* Owner */
  list     : (eventoId)              => client.get(`/eventos/${eventoId}/waitlist`).then(r => r.data),
  promover : (eventoId, id)          => client.post(`/eventos/${eventoId}/waitlist/${id}/promover`).then(r => r.data),
  quitar   : (eventoId, id)          => client.delete(`/eventos/${eventoId}/waitlist/${id}`).then(r => r.data),
};

import client from './client.js';

export const usuariosApi = {
  list        : ()                    => client.get('/usuarios').then(r => r.data),
  get         : (id)                  => client.get(`/usuarios/${id}`).then(r => r.data),
  mePermisos  : ()                    => client.get('/usuarios/me/permisos').then(r => r.data),
  updateRol   : (id, rol)             => client.patch(`/usuarios/${id}/rol`, { rol }).then(r => r.data),
  updatePermisos: (id, { agregar, quitar }) =>
    client.patch(`/usuarios/${id}/permisos`, { agregar, quitar }).then(r => r.data),
  getPermisos : (id)                  => client.get(`/usuarios/${id}/permisos`).then(r => r.data),
  delete      : (id)                  => client.delete(`/usuarios/${id}`).then(r => r.data),
};

export function EstadoBadge({ estado }) {
  const map = {
    borrador  : 'badge-yellow',
    publicado : 'badge-green',
    cancelado : 'badge-red',
    finalizado: 'badge-gray',
    cerrado   : 'badge-gray',
  };
  return <span className={map[estado] || 'badge-gray'}>{estado}</span>;
}

export function ModalidadBadge({ modalidad }) {
  const map = {
    fisico  : 'badge-blue',
    virtual : 'badge-purple',
    hibrido : 'badge-green',
  };
  return <span className={map[modalidad] || 'badge-gray'}>{modalidad}</span>;
}

export function RolBadge({ rol }) {
  const map = {
    admin_global: 'badge-purple',
    organizador : 'badge-blue',
    asistente   : 'badge-gray',
  };
  return <span className={map[rol] || 'badge-gray'}>{rol}</span>;
}

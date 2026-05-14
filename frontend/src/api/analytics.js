import client from './client.js';

const getHeaders = () => {
  const token = localStorage.getItem('gestek_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const analyticsApi = {
  overview       : ()   => client.get('/api/analytics',                      { headers: getHeaders() }).then(r => r.data),
  resumen        : ()   => client.get('/api/analytics/resumen',               { headers: getHeaders() }).then(r => r.data),
  populares      : ()   => client.get('/api/analytics/eventos-populares',     { headers: getHeaders() }).then(r => r.data),
  masVistos      : ()   => client.get('/api/analytics/mas-vistos',            { headers: getHeaders() }).then(r => r.data),
  exportarCSV    : ()   => `${client.defaults.baseURL}/api/analytics/exportar-csv`,
  exportarCSVEvento: (id) => `${client.defaults.baseURL}/api/analytics/exportar-csv/${id}`,
};
